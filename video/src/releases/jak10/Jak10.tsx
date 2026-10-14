import { AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT } from "../jak/theme";
import tip from "./fingertip.json";
import { LocChip, TimerChip, WalkRow } from "./LocIcons";

// «ЖАК 10_2»: готовый ролик, добавляем только графику — счётчик «до 70 000 ₽» и плашку комментария с «6,5%», нарисованной пальцем
export const JAK10_FPS = 30;
export const JAK10_SECONDS = 32.56;

const SRC = staticFile("jak10-1080.mp4");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);

// Объём: тёмный «торец» под плашкой + мягкая падающая тень
const DEPTH = `0 10px 0 #000, 0 28px 50px rgba(0,0,0,0.45), 0 8px 18px rgba(0,0,0,0.35)`;
const TEXT_DEPTH = "0 5px 0 rgba(0,0,0,0.85), 0 14px 28px rgba(0,0,0,0.45)";

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, frame, fps };
};

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// 16,15–17,9 с: «до 70 000 ₽» — жёлтая плашка над головой, счёт доходит до конца и держится до смены плана (17,9 с)
const Counter70: React.FC = () => {
  const { t, frame, fps } = useT();
  const from = 16.15;
  const to = 17.88;
  if (t < from || t >= to) return null;
  const enter = spring({ frame: frame - Math.round(from * fps), fps, config: { damping: 200, stiffness: 80 } });
  const out = interpolate(t, [to - 0.3, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const k = enter * out;
  // «70» звучит на 16,40 — счёт 16,40→17,05, дальше держится полное число
  const value = interpolate(t, [16.4, 17.05], [0, 70000], { ...clamp, easing: smooth });
  const done = interpolate(t, [17.05, 17.2, 17.35], [1, 1.05, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 0,
        width: 1080,
        display: "flex",
        justifyContent: "center",
        perspective: 1200,
        opacity: k,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "26px 46px 30px",
          borderRadius: 999,
          background: C.yellow,
          boxShadow: DEPTH,
          transform: `translateY(${(1 - k) * 60}px) rotateX(${(1 - enter) * 35}deg) scale(${(0.85 + 0.15 * k) * done})`,
          transformOrigin: "center bottom",
        }}
      >
        <span style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 64, color: C.plate }}>до</span>
        <span style={{ fontFamily: NUM_FONT, fontWeight: 800, fontSize: 112, color: C.plate, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {fmt(value)}
          <span style={{ fontWeight: 900 }}> ₽</span>
        </span>
      </div>
    </div>
  );
};

type P = [number, number];
const bez = (q: P[], s: number): P => {
  const u = 1 - s;
  const a = u * u * u, b = 3 * u * u * s, c = 3 * u * s * s, d = s * s * s;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
};
const poly = (segs: P[][], scale: number, at: P): P[] =>
  segs.flatMap((q) => Array.from({ length: 20 }, (_, i) => bez(q, i / 19))).map(([x, y]) => [at[0] + x * scale, at[1] + y * scale]);

// Глифы в поле ~100×150 (центр — 0,0)
const SIX: P[][] = [
  [[30, -70], [-10, -65], [-45, -20], [-45, 25]],
  [[-45, 25], [-45, 75], [40, 80], [42, 30]],
  [[42, 30], [44, -10], [-20, -15], [-44, 20]],
];
const FIVE: P[][] = [
  [[40, -70], [20, -70], [0, -70], [-30, -70]],
  [[-30, -70], [-34, -45], [-38, -20], [-40, -5]],
  [[-40, -5], [5, -30], [55, -5], [45, 35]],
  [[45, 35], [35, 80], [-25, 80], [-45, 50]],
];

const partial = (pts: P[], frac: number) => {
  const n = Math.max(1, Math.round((pts.length - 1) * frac));
  return { d: "M" + pts.slice(0, n + 1).map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L"), end: pts[n] };
};

// Кончик пальца из MediaPipe (tools/fingertip.py), сглаженный — для светящейся точки «ручки»
const tipAt = (t: number): P | null => {
  const i = (t - tip.start) * tip.fps;
  const pts = tip.points as (number[] | null)[];
  let sx = 0, sy = 0, w = 0;
  for (let k = Math.floor(i) - 3; k <= Math.floor(i) + 3; k++) {
    const p = pts[k];
    if (!p) continue;
    const g = Math.exp(-0.5 * ((k - i) / 1.6) ** 2);
    sx += p[0] * g;
    sy += p[1] * g;
    w += g;
  }
  return w ? [sx / w, sy / w] : null;
};

// «6,5%» пальцем: «6» пишется 27,87–28,35 (рука у груди слева), «5» — 28,47–29,05 (справа выше), «,» и «%» — следом
const Draw65: React.FC = () => {
  const { t } = useT();
  if (t < 27.85 || t >= 31.0) return null;
  const six = poly(SIX, 1.25, [470, 790]);
  const five = poly(FIVE, 1.25, [735, 650]);
  const f6 = interpolate(t, [27.87, 28.35], [0, 1], { ...clamp, easing: smooth });
  const f5 = interpolate(t, [28.47, 29.05], [0, 1], { ...clamp, easing: smooth });
  const comma = interpolate(t, [28.38, 28.46], [0, 1], clamp);
  const pct = interpolate(t, [29.05, 29.35], [0, 1], { ...clamp, easing: smooth });
  const out = interpolate(t, [30.6, 31.0], [1, 0], clamp);
  const writing = t < 29.05;
  const pen = writing ? tipAt(t) : null;
  const p6 = partial(six, f6);
  const p5 = partial(five, f5);
  const line = { fill: "none", stroke: C.yellow, strokeWidth: 22, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible", opacity: out }}>
      <defs>
        {/* Объём: чёрный «торец» со сдвигом вниз + мягкая тень */}
        <filter id="depth65" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx={0} dy={8} stdDeviation={0} floodColor="#000" floodOpacity={0.9} />
          <feDropShadow dx={0} dy={18} stdDeviation={14} floodColor="#000" floodOpacity={0.45} />
        </filter>
      </defs>
      <g filter="url(#depth65)">
        {f6 > 0 ? <path d={p6.d} {...line} /> : null}
        {comma > 0 ? <circle cx={612} cy={880} r={13 * comma} fill={C.yellow} /> : null}
        {f5 > 0 ? <path d={p5.d} {...line} /> : null}
        {pct > 0 ? (
          <text
            x={880}
            y={720}
            fontFamily={NUM_FONT}
            fontWeight={900}
            fontSize={150}
            fill={C.yellow}
            opacity={pct}
            transform={`translate(0 ${(1 - pct) * 20})`}
          >
            %
          </text>
        ) : null}
      </g>
      {pen ? (
        <circle cx={pen[0]} cy={pen[1]} r={18} fill={C.white} style={{ filter: "drop-shadow(0 0 16px rgba(245,220,5,0.95))" }} />
      ) : null}
    </svg>
  );
};

// 27,3–31,0 с: плашка «напишите в комментариях» — печатается по буквам, затем «6,5%» жёлтым
const CommentPlate: React.FC = () => {
  const { t, frame, fps } = useT();
  const from = 27.3;
  const to = 31.0;
  if (t < from || t >= to) return null;
  const enter = spring({ frame: frame - Math.round(from * fps), fps, config: { damping: 200, stiffness: 80 } });
  const out = interpolate(t, [to - 0.4, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const k = enter * out;
  const line1 = "напишите в комментариях";
  const line2 = "6,5%";
  const c1 = Math.round(interpolate(t, [27.36, 28.3], [0, line1.length], clamp));
  const c2 = Math.round(interpolate(t, [29.2, 29.6], [0, line2.length], clamp));
  const typing2 = t >= 29.2;
  const cursor = Math.floor(t * 3) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        top: 1460,
        height: 200,
        borderRadius: 999,
        background: C.plate,
        boxShadow: "0 10px 0 #000, 0 28px 50px rgba(0,0,0,0.45)",
        border: `4px solid ${C.yellow}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: k,
        transform: `translateY(${(1 - k) * 50}px) scale(${0.9 + 0.1 * k})`,
      }}
    >
      <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 46, color: C.white, whiteSpace: "pre" }}>
        {line1.slice(0, c1)}
        <span style={{ opacity: 0 }}>{line1.slice(c1)}</span>
      </div>
      <div style={{ fontFamily: NUM_FONT, fontWeight: 900, fontSize: 70, color: C.yellow, lineHeight: 1.05, textShadow: TEXT_DEPTH, minHeight: 74 }}>
        {typing2 ? `«${line2.slice(0, c2)}${c2 >= line2.length ? "»" : ""}` : ""}
        <span style={{ color: C.white, opacity: cursor && (c1 < line1.length || (typing2 && c2 < line2.length)) ? 1 : 0 }}>|</span>
      </div>
    </div>
  );
};

export const Jak10: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={SRC} />
    {/* Локации (правка 15.10.2026): значки на словах о месте и инфраструктуре */}
    <LocChip from={11.2} to={13.95} icon="plan" text="двухкомнатная" sub="квартира" />
    <Counter70 />
    <LocChip from={17.92} to={18.68} icon="city" text="город в городе" />
    <LocChip from={18.7} to={19.7} icon="train" text="МЦД Химки" sub="рядом" />
    <TimerChip from={19.72} countAt={19.84} countEnd={20.4} to={22.05} minutes={15} />
    <WalkRow from={22.1} to={23.4} />
    <CommentPlate />
    <Draw65 />
  </AbsoluteFill>
);
