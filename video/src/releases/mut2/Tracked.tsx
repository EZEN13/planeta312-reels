import { Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, SCRIPT_FONT } from "../jak/theme";
import { onQuad, PlaneLayer, PlaneTrack, projectPoint } from "./Plane";

// Рисунки, привязанные к стене/полу трекером с перспективой. Подписи — закреплены на экране.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);
const LINE = { stroke: C.yellow, strokeWidth: 9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
const GLOW = "drop-shadow(0 0 10px rgba(245,220,5,0.55))";
const TEXT_SHADOW = "0 4px 22px rgba(0,0,0,0.45)";

type P = [number, number];

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, fps };
};
const draw = (t: number, from: number, dur: number) => interpolate(t, [from, from + dur], [0, 1], { ...clamp, easing: smooth });
const fadeOut = (t: number, to: number) => interpolate(t, [to - 0.4, to], [1, 0], clamp);
const path = (pts: P[], close = false) => "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") + (close ? " Z" : "");

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", filter: GLOW }}>
    {children}
  </svg>
);

// Вырезанный спикер поверх рисунка: рука перед линиями на стене (tools/matte.py)
const MatteOver: React.FC<{ src: string; rawStart: number; offset: number }> = ({ src, rawStart, offset }) => {
  const { fps } = useT();
  return (
    <Sequence from={Math.round((rawStart - offset) * fps)} layout="none">
      <div style={{ position: "absolute", inset: 0 }}>
        <OffthreadVideo src={staticFile(src)} transparent muted />
      </div>
    </Sequence>
  );
};

const PinnedLabel: React.FC<{ x: number; y: number; k: number; script?: string; text: string; size?: number }> = ({ x, y, k, script, text, size = 64 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: k, transform: `translateY(${(1 - k) * 16}px)`, filter: `blur(${(1 - k) * 6}px)`, textShadow: TEXT_SHADOW }}>
    {script ? <div style={{ fontFamily: SCRIPT_FONT, fontSize: size * 0.82, color: C.white, lineHeight: 1 }}>{script}</div> : null}
    <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: size, color: C.yellow, lineHeight: 1.08, whiteSpace: "pre" }}>{text}</div>
  </div>
);

// «Убрать вот эту стенку … перегородить … отдельную комнату»
export const WallPlan: React.FC<{
  from: number;
  crossAt: number;
  lineAt: number;
  labelAt: number;
  to: number;
  offset: number;
  wall: { track: PlaneTrack; quad: P[] };
  floor: { track: PlaneTrack; line: [P, P] };
  matte: { src: string; rawStart: number };
}> = ({ from, crossAt, lineAt, labelAt, to, offset, wall, floor, matte }) => {
  const { t } = useT();
  if (t < from - 0.05 || t >= to) return null;
  const out = fadeOut(t, to);
  const k = draw(t, from, 1.0);
  const x = draw(t, crossAt, 0.5);
  const l = draw(t, lineAt, 0.7);
  const lb = draw(t, labelAt, 0.5);
  const q = wall.quad;
  // Контур стены с отступом внутрь, крест — по диагоналям центральной части
  const inset = [onQuad(q, 0.03, 0.06), onQuad(q, 0.97, 0.06), onQuad(q, 0.97, 0.94), onQuad(q, 0.03, 0.94)] as P[];
  const c1 = [onQuad(q, 0.38, 0.32), onQuad(q, 0.72, 0.62)] as P[];
  const c2 = [onQuad(q, 0.72, 0.32), onQuad(q, 0.38, 0.62)] as P[];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <PlaneLayer track={wall.track} offset={offset}>
        <Svg>
          <defs>
            <mask id="wall-reveal">
              <path d={path(inset, true)} stroke="#fff" strokeWidth={24} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
            </mask>
          </defs>
          <path d={path(inset, true)} {...LINE} strokeDasharray="30 24" mask="url(#wall-reveal)" />
          <path d={path(c1)} {...LINE} strokeWidth={14} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, x * 2)} />
          <path d={path(c2)} {...LINE} strokeWidth={14} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, x * 2 - 1)} />
        </Svg>
      </PlaneLayer>
      <PlaneLayer track={floor.track} offset={offset}>
        <Svg>
          <path d={path(floor.line)} {...LINE} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l} />
        </Svg>
      </PlaneLayer>
      <MatteOver src={matte.src} rawStart={matte.rawStart} offset={offset} />
      <PinnedLabel x={70} y={170} k={lb} script="здесь будет" text={"отдельная\nкомната"} />
    </div>
  );
};

// «Ванна здесь будет установлена»: силуэт ванны контуром на стене у пола
export const BathSketch: React.FC<{ from: number; to: number; offset: number; wall: { track: PlaneTrack; quad: P[] }; matte: { src: string; rawStart: number } }> = ({
  from,
  to,
  offset,
  wall,
  matte,
}) => {
  const { t } = useT();
  if (t < from - 0.05 || t >= to) return null;
  const k = draw(t, from, 1.1);
  const tap = draw(t, from + 0.9, 0.4);
  const fill = draw(t, from + 0.8, 0.5);
  const q = wall.quad;
  // Ванна сбоку в координатах стены (u — вдоль стены, v — сверху вниз): прямой борт, скруглённые торцы, плоское дно
  const u0 = 0.2;
  const u1 = 0.86;
  const rim = 0.7;
  const bot = 0.93;
  const arc = (uc: number, from: number, to: number, ru: number, rv: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const a = from + ((to - from) * i) / 11;
      return onQuad(q, uc + Math.cos(a) * ru, rim + Math.sin(a) * rv);
    });
  const ru = 0.07;
  const rv = bot - rim;
  const body: P[] = [
    onQuad(q, u0, rim),
    onQuad(q, u1, rim),
    ...arc(u1 - ru, 0, Math.PI / 2, ru, rv),
    ...arc(u0 + ru, Math.PI / 2, Math.PI, ru, rv),
    onQuad(q, u0, rim),
  ];
  const inner: P[] = [onQuad(q, u0 + 0.03, rim + 0.035), onQuad(q, u1 - 0.03, rim + 0.035)];
  const feet: P[][] = [
    [onQuad(q, u0 + 0.1, bot - 0.005), onQuad(q, u0 + 0.1, 0.985)],
    [onQuad(q, u1 - 0.1, bot - 0.005), onQuad(q, u1 - 0.1, 0.985)],
  ];
  const tapPts: P[] = [onQuad(q, u1 - 0.05, rim), onQuad(q, u1 - 0.05, rim - 0.09), onQuad(q, u1 - 0.12, rim - 0.09), onQuad(q, u1 - 0.12, rim - 0.06)];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut(t, to) }}>
      <PlaneLayer track={wall.track} offset={offset}>
        <Svg>
          <path d={path(body, true)} fill={C.yellow} fillOpacity={0.14 * fill} stroke="none" />
          <path d={path(body)} {...LINE} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
          <path d={path(inner)} {...LINE} strokeWidth={6} opacity={fill} />
          {feet.map((f, i) => (
            <path key={i} d={path(f)} {...LINE} opacity={tap} />
          ))}
          <path d={path(tapPts)} {...LINE} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tap} />
        </Svg>
      </PlaneLayer>
      <MatteOver src={matte.src} rawStart={matte.rawStart} offset={offset} />
    </div>
  );
};

// Выноска на объект вдали: эллипс прилип к зданию, подпись закреплена на экране, линия между ними
export const TrackedCallout: React.FC<{
  from: number;
  to: number;
  offset: number;
  plane: PlaneTrack;
  center: P;
  rx: number;
  ry: number;
  label: { x: number; y: number; text: string };
}> = ({ from, to, offset, plane, center, rx, ry, label }) => {
  const { t } = useT();
  if (t < from || t >= to) return null;
  const k = draw(t, from, 0.75);
  const l = draw(t, from + 0.55, 0.45);
  const lb = draw(t, from + 0.75, 0.45);
  const tip = projectPoint(plane, t + offset, [center[0], center[1] - ry]);
  const anchor: P = [label.x + 60, label.y + 96];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut(t, to) }}>
      <PlaneLayer track={plane} offset={offset}>
        <Svg>
          <ellipse cx={center[0]} cy={center[1]} rx={rx} ry={ry} {...LINE} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
        </Svg>
      </PlaneLayer>
      <Svg>
        <path d={path([anchor, tip])} {...LINE} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l} />
      </Svg>
      <PinnedLabel x={label.x} y={label.y} k={lb} text={label.text} size={76} />
    </div>
  );
};
