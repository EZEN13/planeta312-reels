import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadAlternates } from "@remotion/google-fonts/MontserratAlternates";

// Универсальные плашки Планеты-312 (ТЗ «хус тел», 16.10.2026):
// фон — чёрный 80 %, текст и цифры — жёлтые, печатаются (typewriter), плашка появляется плавно, лёгкая тень.
// InfoPlate — одна строка: вопрос, число или цена. PairPlate — две смысловые единицы: вопрос + ответ, подпись + цена.
const subsets = ["latin", "cyrillic"] as const;
const TEXT_FONT = loadAlternates("normal", { weights: ["800"], subsets: [...subsets] }).fontFamily;
const NUM_FONT = loadMontserrat("normal", { weights: ["800"], subsets: [...subsets] }).fontFamily;

export const PLATE = {
  bg: "rgba(17, 17, 17, 0.8)",
  yellow: "#F5DC05",
  shadow: "0 14px 40px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.18)",
  radius: 40,
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);

// Плавность
const ENTER_SEC = 0.5;
const EXIT_SEC = 0.4;
// Скорость печати: ~22 символа в секунду, но строка допечатывается не дольше чем за 1,1 с
const CPS = 22;
const MAX_TYPE_SEC = 1.1;
const LABEL_MAX_SEC = 0.5;

const isNumeric = (s: string) => /^[\d\s.,]+(\s?₽|%|м²)?$/.test(s.trim());

// Печать строки: появляется по символу, курсор мигает, пока печатается
const Typed: React.FC<{ text: string; from: number; size: number; color?: string; opacity?: number; maxSec?: number }> = ({
  text,
  from,
  size,
  color = PLATE.yellow,
  opacity = 1,
  maxSec = MAX_TYPE_SEC,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = Math.min(maxSec, text.length / CPS);
  const n = Math.round(interpolate(t, [from, from + dur], [0, text.length], clamp));
  const typing = t >= from && n < text.length;
  const num = isNumeric(text);
  return (
    <div
      style={{
        fontFamily: num ? NUM_FONT : TEXT_FONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: num ? "-0.01em" : 0,
        color,
        opacity,
        whiteSpace: "pre-wrap",
        textAlign: "center",
      }}
    >
      {text.slice(0, n)}
      {/* Курсор сразу за последней буквой; ширины не занимает */}
      {typing ? (
        <span style={{ display: "inline-block", width: 0, overflow: "visible", opacity: Math.floor(t * 4) % 2 ? 0 : 1 }}>|</span>
      ) : null}
      {/* Невидимый остаток держит ширину и переносы — плашка не «дышит» во время печати */}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

const usePlateLife = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = interpolate(t, [from, from + ENTER_SEC], [0, 1], { ...clamp, easing: smooth });
  const out = interpolate(t, [to - EXIT_SEC, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return { t, k: enter * out, enter };
};

const Shell: React.FC<{ k: number; enter: number; top: number; width: number; children: React.ReactNode }> = ({ k, enter, top, width, children }) => (
  <div style={{ position: "absolute", top, left: 0, width: 1080, display: "flex", justifyContent: "center", opacity: k }}>
    <div
      style={{
        maxWidth: width,
        padding: "34px 52px 38px",
        borderRadius: PLATE.radius,
        background: PLATE.bg,
        boxShadow: PLATE.shadow,
        transform: `translateY(${(1 - enter) * 34}px) scale(${0.94 + 0.06 * enter})`,
        filter: `blur(${(1 - enter) * 4}px)`,
      }}
    >
      {children}
    </div>
  </div>
);

// Одна строка: «Когда была куплена квартира?», «2021», «8 400 000 ₽»
export const InfoPlate: React.FC<{ from: number; to: number; text: string; top?: number; size?: number; width?: number }> = ({
  from,
  to,
  text,
  top = 260,
  size,
  width = 920,
}) => {
  const { t, k, enter } = usePlateLife(from, to);
  if (t < from || t >= to) return null;
  const num = isNumeric(text);
  return (
    <Shell k={k} enter={enter} top={top} width={width}>
      <Typed text={text} from={from + 0.25} size={size ?? (num ? 108 : 64)} />
    </Shell>
  );
};

// Две единицы: «Сколько комнат в квартире?» → «3», «Цена квартиры» → «12 000 000 ₽».
// Сначала печатается подпись, затем — крупно ответ; между ними тонкая жёлтая линия.
export const PairPlate: React.FC<{
  from: number;
  to: number;
  label: string;
  value: string;
  valueAt?: number; // когда печатать ответ (по слову в речи); по умолчанию — сразу после подписи
  top?: number;
  width?: number;
}> = ({ from, to, label, value, valueAt, top = 240, width = 980 }) => {
  const { t, k, enter } = usePlateLife(from, to);
  if (t < from || t >= to) return null;
  const labelAt = from + 0.15;
  // Подпись в паре печатается быстрее и всегда успевает до ответа
  const labelEnd = labelAt + Math.min(LABEL_MAX_SEC, label.length / CPS);
  const vAt = Math.max(valueAt ?? labelEnd + 0.15, labelEnd + 0.08);
  const line = interpolate(t, [vAt - 0.2, vAt + 0.25], [0, 1], { ...clamp, easing: smooth });
  const num = isNumeric(value);
  return (
    <Shell k={k} enter={enter} top={top} width={width}>
      <Typed text={label} from={labelAt} size={label.length > 22 ? 46 : 52} opacity={0.92} maxSec={LABEL_MAX_SEC} />
      <div style={{ height: 4, borderRadius: 2, background: PLATE.yellow, opacity: 0.55, margin: "18px auto 14px", width: `${line * 60}%` }} />
      <Typed text={value} from={vAt} size={num ? 112 : 72} />
    </Shell>
  );
};
