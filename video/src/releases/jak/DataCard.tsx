import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT, PLATE_RADIUS } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Step = {
  at: number; // секунда смены содержимого
  label: string;
  value?: number; // число — считается от нуля
  valueAt?: number; // когда число начинает считаться (по слову); по умолчанию at
  text?: string; // вместо числа — текст
  suffix?: string;
  color?: string;
};

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Карточка, закрывающая вшитую плашку исходника. Поле box — рамка плашки в кадре 1080×1920.
// Карточка непрозрачна с первого кадра (иначе сквозь неё видно старую плашку); движется только содержимое.
export const DataCard: React.FC<{
  from: number;
  to: number;
  box: { x: number; y: number; w: number; h: number };
  steps: Step[];
  chip?: string;
  chipColor?: string;
  exitAnim?: boolean;
}> = ({ from, to, box, steps, chip, chipColor = C.yellow, exitAnim = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < from || t >= to) return null;

  const local = t - from;
  const settle = interpolate(local, [0, 0.25], [1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = exitAnim ? interpolate(t, [to - 0.2, to], [1, 0], clamp) : 1;
  // Жёлтая полоса пробегает по верхнему краю при появлении карточки
  const sweep = interpolate(local, [0, 0.45], [0, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  let idx = 0;
  steps.forEach((st, i) => {
    if (t >= st.at) idx = i;
  });
  const s = steps[idx];
  const since = t - s.at;
  const swap = interpolate(since, [0, 0.22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const labelChars = Math.round(interpolate(since, [0, 0.3], [0, s.label.length], clamp));
  const vAt = s.valueAt ?? s.at;
  const vSince = t - vAt;
  const count = interpolate(vSince, [0, 0.55], [0, s.value ?? 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const valueIn = interpolate(vSince, [0, 0.18], [0, 1], clamp);
  const pop = interpolate(vSince, [0.5, 0.6, 0.75], [1, 1.06, 1], clamp);

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
      <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${sweep}%`, background: C.yellow }} />
      {chip ? (
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 26,
            padding: "6px 16px",
            borderRadius: 999,
            border: `3px solid ${chipColor}`,
            color: chipColor,
            fontFamily: LABEL_FONT,
            fontWeight: 800,
            fontSize: 26,
          }}
        >
          {chip}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transform: `translateY(${(1 - swap) * 40}px)`,
          opacity: swap,
        }}
      >
        <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 52, color: C.yellow, lineHeight: 1.1 }}>
          {s.label.slice(0, labelChars)}
          <span style={{ opacity: 0 }}>{s.label.slice(labelChars)}</span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: NUM_FONT,
            fontWeight: 200,
            fontSize: s.text ? 92 : (s.value ?? 0) >= 1e6 ? 112 : 132,
            lineHeight: 1.05,
            color: s.color ?? C.white,
            opacity: valueIn,
            transform: `scale(${pop})`,
            whiteSpace: "nowrap",
          }}
        >
          {s.text ?? (
            <>
              {fmt(count)}
              {s.suffix ? <span style={{ fontWeight: 300 }}>{s.suffix}</span> : null}
            </>
          )}
        </div>
      </div>
      {/* Точки шагов внизу карточки */}
      {steps.length > 1 ? (
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 34 : 10,
                height: 10,
                borderRadius: 999,
                background: i <= idx ? C.yellow : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
