import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type P = [number, number];
// Рукописные «2» и «6» кубическими кривыми в поле 340×260 (линии — вырожденные кривые)
const STROKES: [P, P, P, P][][] = [
  [
    [[22, 74], [30, 18], [124, 6], [132, 62]],
    [[132, 62], [140, 112], [62, 160], [16, 232]],
    [[16, 232], [60, 232], [110, 232], [152, 232]],
  ],
  [
    [[300, 30], [232, 58], [190, 150], [208, 200]],
    [[208, 200], [222, 246], [300, 248], [310, 196]],
    [[310, 196], [318, 150], [262, 134], [218, 176]],
  ],
];

const bez = (q: [P, P, P, P], t: number): P => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * q[0][0] + b * q[1][0] + c * q[2][0] + d * q[3][0], a * q[0][1] + b * q[1][1] + c * q[2][1] + d * q[3][1]];
};

// Ломаная по каждой цифре — для рисования по длине и для светящегося «кончика ручки»
const POLYS: P[][] = STROKES.map((segs) => segs.flatMap((q) => Array.from({ length: 24 }, (_, i) => bez(q, i / 23))));
const lengths = POLYS.map((pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0));

const partial = (pts: P[], len: number, frac: number): { d: string; tip: P } => {
  let left = len * frac;
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length && left > 0; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (seg <= left) {
      out.push(pts[i]);
      left -= seg;
    } else {
      const k = left / seg;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      left = 0;
    }
  }
  return { d: "M" + out.map((p) => p.join(" ")).join(" L"), tip: out[out.length - 1] };
};

// «26», нарисованная в воздухе вслед за ручкой, потом улетает в карточку (to — центр значения карточки)
export const DrawNumber: React.FC<{
  start: number;
  split: number;
  end: number;
  flyAt: number;
  center: P;
  to: P;
  scale?: number;
}> = ({ start, split, end, flyAt, center, to, scale = 1.1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < start || t > flyAt + 0.35) return null;

  const fr = [
    interpolate(t, [start, split], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }),
    interpolate(t, [split, end], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) }),
  ];
  const parts = POLYS.map((pts, i) => partial(pts, lengths[i], fr[i]));
  const drawing = t < end ? (t < split ? 0 : 1) : -1;
  const fly = interpolate(t, [flyAt, flyAt + 0.3], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = center[0] + (to[0] - center[0]) * fly;
  const y = center[1] + (to[1] - center[1]) * fly;
  const s = scale * (1 - 0.65 * fly);

  return (
    <svg
      width={340}
      height={260}
      viewBox="0 0 340 260"
      style={{
        position: "absolute",
        left: x - 170,
        top: y - 130,
        overflow: "visible",
        transform: `scale(${s})`,
        opacity: 1 - fly * 0.6,
        filter: `drop-shadow(0 0 14px ${C.yellow}) drop-shadow(0 0 30px rgba(245,220,5,0.6))`,
      }}
    >
      {parts.map((p, i) =>
        fr[i] > 0 ? (
          <path key={i} d={p.d} fill="none" stroke={C.yellow} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
        ) : null,
      )}
      {drawing >= 0 ? <circle cx={parts[drawing].tip[0]} cy={parts[drawing].tip[1]} r={16} fill={C.white} /> : null}
    </svg>
  );
};
