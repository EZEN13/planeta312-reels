import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);

// Плавность (секунды) — правка «анимации плавнее» 14.10.2026
const ENTER_SEC = 0.55;
const EXIT_SEC = 0.4;
const SWAP_SEC = 0.45;
const COUNT_SEC = 0.9;
// Счёт обязан дойти до названной суммы и подержаться до смены (правка 14.10.2026)
const HOLD_SEC = 0.3;
const MIN_COUNT_SEC = 0.35;

export type Step = {
  at: number; // секунда смены содержимого
  label: string;
  value?: number; // число — считается от нуля
  valueAt?: number; // когда число начинает считаться (по слову); по умолчанию at
  text?: string; // вместо числа — текст
  count?: boolean; // false — число появляется сразу, без счёта
  suffix?: string;
  color?: string;
};

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Карточка с цифрами. Под ней — подкладка из исходника (RawPatch), поэтому вшитую плашку не видно.
export const DataCard: React.FC<{
  from: number;
  to: number;
  box: { x: number; y: number; w: number; h: number };
  steps: Step[];
  chip?: string;
  exitAnim?: boolean;
}> = ({ from, to, box, steps, chip, exitAnim = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < from || t >= to) return null;

  const enter = interpolate(t - from, [0, ENTER_SEC], [0, 1], { ...clamp, easing: smooth });
  const out = exitAnim ? interpolate(t, [to - EXIT_SEC, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }) : 1;
  const k = enter * out;
  const sweep = interpolate(t - from, [0.15, 0.95], [0, 100], { ...clamp, easing: smooth });

  let idx = 0;
  steps.forEach((st, i) => {
    if (t >= st.at) idx = i;
  });
  const s = steps[idx];
  const since = t - s.at;
  const swap = idx === 0 ? 1 : interpolate(since, [0, SWAP_SEC], [0, 1], { ...clamp, easing: smooth });
  const vAt = s.valueAt ?? s.at;
  const vSince = t - vAt;
  const nextAt = steps[idx + 1]?.at ?? (exitAnim ? to - EXIT_SEC : to);
  const countSec = Math.max(MIN_COUNT_SEC, Math.min(COUNT_SEC, nextAt - vAt - HOLD_SEC));
  const count =
    s.count === false
      ? (s.value ?? 0)
      : interpolate(vSince, [0, countSec], [0, s.value ?? 0], { ...clamp, easing: smooth });
  const valueIn = interpolate(vSince, [0, 0.3], [0, 1], { ...clamp, easing: smooth });
  const big = (s.value ?? 0) >= 1e6;

  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        borderRadius: Math.min(box.h / 2, 90),
        background: C.plate,
        transform: `translateY(${(1 - k) * 40}px) scale(${0.92 + 0.08 * k})`,
        opacity: k,
        overflow: "hidden",
        boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
      }}
    >
      {/* Жёлтая линия пробегает по нижнему краю при появлении */}
      <div
        style={{
          position: "absolute",
          bottom: 26,
          left: "50%",
          height: 6,
          width: `${sweep * 0.5}%`,
          transform: "translateX(-50%)",
          borderRadius: 999,
          background: C.yellow,
        }}
      />
      {chip ? (
        <div
          style={{
            position: "absolute",
            top: 26,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 20px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            color: C.white,
            fontFamily: LABEL_FONT,
            fontWeight: 800,
            fontSize: 26,
            whiteSpace: "nowrap",
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
          paddingTop: chip ? 30 : 0,
          transform: `translateY(${(1 - swap) * 30}px)`,
          opacity: swap,
          filter: `blur(${(1 - swap) * 6}px)`,
        }}
      >
        <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 50, color: C.yellow, lineHeight: 1.1 }}>{s.label}</div>
        <div
          style={{
            marginTop: 8,
            fontFamily: NUM_FONT,
            fontWeight: 600,
            fontSize: s.text ? 88 : big ? 108 : 126,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: s.color ?? C.white,
            opacity: valueIn,
            whiteSpace: "nowrap",
          }}
        >
          {s.text ?? (
            <>
              {fmt(count)}
              {s.suffix ? <span style={{ fontWeight: 800 }}>{s.suffix}</span> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
