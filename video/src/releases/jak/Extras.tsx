import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT, PLATE_RADIUS } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, fps, frame };
};

type Box = { x: number; y: number; w: number; h: number };

const Plate: React.FC<{ box: Box; children: React.ReactNode; from: number; to: number }> = ({ box, children, from, to }) => {
  const { t } = useT();
  if (t < from || t >= to) return null;
  const settle = interpolate(t - from, [0, 0.25], [1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(t, [to - 0.2, to], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: PLATE_RADIUS,
        background: C.plate,
        transform: `scale(${settle * (0.9 + 0.1 * out)})`,
        opacity: out,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
};

// «льготная VS стандартная» — закрывает две вшитые плашки
export const VsCard: React.FC<{ from: number; to: number; box: Box; leftAt: number; vsAt: number; rightAt: number }> = ({
  from,
  to,
  box,
  leftAt,
  vsAt,
  rightAt,
}) => {
  const { t, fps, frame } = useT();
  const sp = (at: number) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 14, stiffness: 200 } });
  const l = sp(leftAt);
  const v = sp(vsAt);
  const r = sp(rightAt);
  const pill = (text: string, k: number, dir: number, filled: boolean) => (
    <div
      style={{
        padding: "16px 26px",
        borderRadius: 999,
        background: filled ? C.yellow : "transparent",
        border: `4px solid ${C.yellow}`,
        color: filled ? C.plate : C.yellow,
        fontFamily: LABEL_FONT,
        fontWeight: 800,
        fontSize: 40,
        opacity: k,
        transform: `translateX(${(1 - k) * dir * 120}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
  return (
    <Plate box={box} from={from} to={to}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {pill("льготная", l, -1, true)}
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 999,
            background: C.red,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: NUM_FONT,
            fontWeight: 900,
            fontSize: 38,
            transform: `scale(${v}) rotate(${(1 - v) * -90 + Math.sin(t * 9) * 3 * v}deg)`,
          }}
        >
          VS
        </div>
        {pill("стандартная", r, 1, false)}
      </div>
    </Plate>
  );
};

// Пузырь комментария «без ПВ» — закрывает вшитую плашку призыва
export const CommentCta: React.FC<{ from: number; to: number; box: Box; typeAt: number; heartAt: number }> = ({
  from,
  to,
  box,
  typeAt,
  heartAt,
}) => {
  const { t, fps, frame } = useT();
  const text = "без ПВ";
  const chars = Math.round(interpolate(t, [typeAt, typeAt + 0.45], [0, text.length], clamp));
  const heart = spring({ frame: frame - Math.round(heartAt * fps), fps, config: { damping: 9, stiffness: 220 } });
  const cursor = Math.floor(t * 3) % 2 === 0 && chars < text.length + 1;
  return (
    <Plate box={box} from={from} to={to}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 34px", gap: 26 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: C.yellow,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: NUM_FONT,
            fontWeight: 900,
            fontSize: 34,
            color: C.plate,
          }}
        >
          312
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 32, color: C.white, opacity: 0.85 }}>
            напишите в комментариях
          </div>
          <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 64, color: C.yellow, lineHeight: 1.15 }}>
            «{text.slice(0, chars)}
            {chars >= text.length ? "»" : ""}
            <span style={{ opacity: cursor ? 1 : 0, color: C.white }}>|</span>
          </div>
        </div>
        <svg width={70} height={64} viewBox="0 0 24 22" style={{ transform: `scale(${heart})`, flexShrink: 0 }}>
          <path d="M12 21 2.5 11.6a5.6 5.6 0 0 1 8-8L12 5l1.5-1.4a5.6 5.6 0 0 1 8 8z" fill={C.red} />
        </svg>
      </div>
    </Plate>
  );
};

// Метка раздела сверху слева: «ВАРИАНТ 1 · новостройка»
export const ChapterTag: React.FC<{ from: number; to: number; num: string; text: string; y?: number }> = ({
  from,
  to,
  num,
  text,
  y = 150,
}) => {
  const { t } = useT();
  if (t < from || t >= to) return null;
  const k = interpolate(t, [from, from + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(t, [to - 0.25, to], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: y,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 18,
        overflow: "hidden",
        opacity: out,
        transform: `translateX(${(1 - k) * -420}px)`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ background: C.yellow, color: C.plate, padding: "14px 22px", fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 34 }}>
        {num}
      </div>
      <div style={{ background: C.plate, color: C.white, padding: "14px 24px", fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 34 }}>
        {text}
      </div>
    </div>
  );
};

const House: React.FC<{ color: string }> = ({ color }) => (
  <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round">
    <path d="M3 11 12 4l9 7v9H3z" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

// Плашки сверху по словам: «вторичный рынок», «первичный рынок», «выгоднее ✓», «нет ПВ?»
export const TopChip: React.FC<{ at: number; to: number; text: string; x: number; y: number; icon?: "house" | "check" | "ask"; filled?: boolean }> = ({
  at,
  to,
  text,
  x,
  y,
  icon,
  filled,
}) => {
  const { t, fps, frame } = useT();
  if (t < at || t >= to) return null;
  const k = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 12, stiffness: 210 } });
  const out = interpolate(t, [to - 0.2, to], [1, 0], clamp);
  const fg = filled ? C.plate : C.white;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 28px 16px 20px",
        borderRadius: 999,
        background: filled ? C.yellow : C.plate,
        opacity: out,
        transform: `scale(${k}) rotate(${(1 - k) * -8}deg)`,
        transformOrigin: "left center",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      {icon === "house" ? <House color={filled ? C.plate : C.yellow} /> : null}
      {icon === "check" ? (
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5 9.5 18 20 6" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
        </svg>
      ) : null}
      {icon === "ask" ? <span style={{ fontFamily: NUM_FONT, fontWeight: 900, fontSize: 46, color: C.red }}>?</span> : null}
      <span style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 40, color: fg }}>{text}</span>
    </div>
  );
};

// Динамика: вспышка-приближение после каждой склейки и «удары» приближения на ключевых словах
export const useCameraFx = (cuts: number[], punches: number[], shakes: number[]) => {
  const { t } = useT();
  let scale = 1;
  let blur = 0;
  let bright = 1;
  for (const c of cuts) {
    const d = t - c;
    if (d >= 0 && d < 0.3) {
      scale += interpolate(d, [0, 0.25], [0.07, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
      blur += interpolate(d, [0, 0.15], [7, 0], clamp);
      bright += interpolate(d, [0, 0.12], [0.35, 0], clamp);
    }
  }
  for (const p of punches) {
    scale += interpolate(t, [p, p + 0.12, p + 0.6, p + 0.95], [0, 0.07, 0.07, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
  }
  let dx = 0;
  let dy = 0;
  for (const s of shakes) {
    const d = t - s;
    if (d >= 0 && d < 0.45) {
      const a = 14 * (1 - d / 0.45);
      dx += Math.sin(d * 95) * a;
      dy += Math.cos(d * 77) * a * 0.6;
    }
  }
  return { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, filter: `blur(${blur}px) brightness(${bright})` };
};
