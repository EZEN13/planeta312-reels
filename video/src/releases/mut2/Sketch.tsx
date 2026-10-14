import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT, SCRIPT_FONT } from "../jak/theme";

// «Чертёж маркером»: одна жёлтая линия на весь ролик — 8 px, скруглённые концы, мягкое свечение
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);
const LINE = { stroke: C.yellow, strokeWidth: 8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
const GLOW = `drop-shadow(0 0 10px rgba(245,220,5,0.55))`;
const TEXT_SHADOW = "0 4px 22px rgba(0,0,0,0.45)";

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const draw = (t: number, from: number, dur: number) => interpolate(t, [from, from + dur], [0, 1], { ...clamp, easing: smooth });
const fadeOut = (t: number, to: number) => interpolate(t, [to - 0.4, to], [1, 0], clamp);

// «56 м²»: квадрат рисует сам себя, число досчитывает до конца и держится
export const AreaSquare: React.FC<{ from: number; to: number; cx: number; cy: number; value: number; size?: number }> = ({
  from,
  to,
  cx,
  cy,
  value,
  size = 300,
}) => {
  const t = useT();
  if (t < from || t >= to) return null;
  const k = draw(t, from, 0.8);
  const n = Math.round(interpolate(t, [from + 0.1, from + 0.9], [0, value], { ...clamp, easing: smooth }));
  const unit = draw(t, from + 0.7, 0.4);
  return (
    <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: fadeOut(t, to) }}>
      <svg width={size} height={size} style={{ position: "absolute", overflow: "visible", filter: GLOW }}>
        <rect x={0} y={0} width={size} height={size} rx={28} {...LINE} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          paddingTop: size * 0.22,
          fontFamily: NUM_FONT,
          fontWeight: 800,
          fontSize: size * 0.46,
          color: C.white,
          textShadow: TEXT_SHADOW,
        }}
      >
        {n}
        <span style={{ fontFamily: LABEL_FONT, fontSize: size * 0.2, color: C.yellow, marginLeft: 8, opacity: unit }}>м²</span>
      </div>
    </div>
  );
};

type P = [number, number];

export type Track = { fps: number; start: number; points: number[][] };

// Сдвиг рисунка вслед за камерой: положение задаётся на кадре refTime, дальше — по трекеру
export const trackShift = (track: Track | undefined, refTime: number, t: number): P => {
  if (!track) return [0, 0];
  const idx = (x: number) => Math.max(0, Math.min(track.points.length - 1, Math.round((x - track.start) * track.fps)));
  const a = track.points[idx(t)];
  const r = track.points[idx(refTime)];
  return [a[0] - r[0], a[1] - r[1]];
};

// Перепланировка: пунктир по стене → крест → линия новой перегородки по полу → подпись
export const WallPlan: React.FC<{
  from: number;
  crossAt: number;
  lineAt: number;
  labelAt: number;
  to: number;
  wall: P[]; // контур стены (замкнутый)
  partition: [P, P]; // новая перегородка на полу
  label: { x: number; y: number; text: string };
  track?: Track;
  refTime?: number;
}> = ({ from, crossAt, lineAt, labelAt, to, wall, partition, label, track, refTime = from }) => {
  const t = useT();
  const [dx, dy] = trackShift(track, refTime, t);
  if (t < from || t >= to) return null;
  const k = draw(t, from, 0.9);
  const x = draw(t, crossAt, 0.45);
  const l = draw(t, lineAt, 0.6);
  const lb = draw(t, labelAt, 0.5);
  const d = "M" + wall.map((p) => p.join(" ")).join(" L") + " Z";
  const xs = wall.map((p) => p[0]);
  const ys = wall.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const r = Math.min(x1 - x0, y1 - y0) * 0.22;
  return (
    <AbsoluteSvg opacity={fadeOut(t, to)} shift={[dx, dy]}>
      {/* Пунктир рисуется «маской»: сплошная пунктирная линия открывается по длине */}
      <defs>
        <mask id="wallReveal">
          <path d={d} stroke="#fff" strokeWidth={20} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
        </mask>
      </defs>
      <path d={d} {...LINE} strokeDasharray="26 22" mask="url(#wallReveal)" />
      <path d={`M${cx - r} ${cy - r} L${cx + r} ${cy + r}`} {...LINE} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, x * 2)} />
      <path d={`M${cx + r} ${cy - r} L${cx - r} ${cy + r}`} {...LINE} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, x * 2 - 1)} />
      <path d={`M${partition[0].join(" ")} L${partition[1].join(" ")}`} {...LINE} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l} />
      <foreignObject x={label.x} y={label.y} width={520} height={160} style={{ opacity: lb, overflow: "visible" }}>
        <div style={{ transform: `translateY(${(1 - lb) * 16}px)`, textShadow: TEXT_SHADOW }}>
          <div style={{ fontFamily: SCRIPT_FONT, fontSize: 52, color: C.white, lineHeight: 1 }}>здесь будет</div>
          <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 60, color: C.yellow, lineHeight: 1.1 }}>{label.text}</div>
        </div>
      </foreignObject>
    </AbsoluteSvg>
  );
};

// Выноска: эллипс вокруг объекта за окном, линия к подписи
export const CircleCallout: React.FC<{
  from: number;
  to: number;
  center: P;
  rx: number;
  ry: number;
  label: { x: number; y: number; text: string };
  track?: Track;
  refTime?: number;
}> = ({ from, to, center, rx, ry, label, track, refTime = from }) => {
  const t = useT();
  const [dx, dy] = trackShift(track, refTime, t);
  if (t < from || t >= to) return null;
  const k = draw(t, from, 0.7);
  const l = draw(t, from + 0.5, 0.4);
  const lb = draw(t, from + 0.75, 0.45);
  const start: P = [center[0], center[1] - ry];
  return (
    <AbsoluteSvg opacity={fadeOut(t, to)} shift={[dx, dy]}>
      <ellipse cx={center[0]} cy={center[1]} rx={rx} ry={ry} {...LINE} transform={`rotate(-4 ${center[0]} ${center[1]})`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
      <path d={`M${start.join(" ")} L${label.x + 40} ${label.y + 92}`} {...LINE} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - l} />
      <foreignObject x={label.x - 40} y={label.y} width={400} height={100} style={{ overflow: "visible" }}>
        <div
          style={{
            fontFamily: LABEL_FONT,
            fontWeight: 800,
            fontSize: 72,
            color: C.white,
            opacity: lb,
            transform: `translateY(${(1 - lb) * 14}px)`,
            textShadow: TEXT_SHADOW,
          }}
        >
          {label.text}
        </div>
      </foreignObject>
    </AbsoluteSvg>
  );
};

const AbsoluteSvg: React.FC<{ children: React.ReactNode; opacity: number; shift?: P }> = ({ children, opacity, shift = [0, 0] }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", inset: 0, overflow: "visible", opacity, filter: GLOW, transform: `translate(${shift[0]}px, ${shift[1]}px)` }}
  >
    {children}
  </svg>
);
