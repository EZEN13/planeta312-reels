import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { KineticWord, Role } from "../components/Kinetic";

// Mutabar по STYLE.md: первые 30,4 с исходника, кинетическая типографика, ключевые слова за спикером
export const MUTABAR2_FPS = 25;
export const MUTABAR2_SECONDS = 30.4;

const SRC = staticFile("мутабар лила обзор  - (9x16).mp4");
// tools/matte.py, 0–30,4 с
const MATTE = staticFile("mattes/mutabar.webm");

// Ключевые — тёплый красный из кадра. Остальные: в квартире (светлый бетон) — графит,
// на улице (тёмная полоса фасада за головами) — белый с тенью (STYLE.md → Цвет)
const ACCENT = "#E4473B";
const INK = "#1B1B1B";
const OUTDOOR_UNTIL = 12.6;

// Склейки исходника — на них сбрасывается медленное приближение
const CUTS = [0, 3.0, 12.6, 17.2, 20.56, 26.6, MUTABAR2_SECONDS];

type W = {
  text: string;
  role: Role;
  at: number;
  y: number;
  x?: number;
  align?: "center" | "left" | "right";
  size?: number;
  color?: string;
};
type Group = { to: number; words: W[] };

// Ключевое слово — за головой: верх слова ≈ макушка − 0,3 размера (макушки — tools/heads.py).
// Связка — над ключевым слева, дополнение — справа на уровне плеч, чтобы не закрывать лицо
const GROUPS: Group[] = [
  {
    to: 2.07,
    words: [
      { text: "передаю", role: "link", at: 0.05, y: 350, x: 170, align: "left" },
      { text: "ключи", role: "key", at: 0.63, y: 400, x: 750, size: 190 },
    ],
  },
  {
    to: 3.0,
    words: [
      { text: "от квартиры", role: "link", at: 1.13, y: 450, x: 150, align: "left" },
      { text: "документы", role: "key", at: 2.07, y: 500, x: 470, size: 150 },
    ],
  },
  {
    to: 6.24,
    words: [
      { text: "приобрели", role: "link", at: 3.0, y: 470, x: 110, align: "left" },
      { text: "евродвушку", role: "key", at: 4.53, y: 520, size: 150 },
    ],
  },
  {
    to: 8.16,
    words: [
      { text: "56", role: "key", at: 6.24, y: 470, x: 470, size: 300 },
      { text: "м²", role: "extra", at: 7.27, y: 560, x: 660, align: "left", size: 130, color: ACCENT },
    ],
  },
  {
    to: 10.82,
    words: [
      { text: "с ежемесячным", role: "link", at: 8.16, y: 440, x: 110, align: "left" },
      { text: "платежом", role: "extra", at: 8.92, y: 470, x: 1000, align: "right", size: 80 },
      { text: "69 000", role: "key", at: 9.54, y: 520, size: 220 },
    ],
  },
  {
    to: 12.06,
    words: [
      { text: "пойдёмте", role: "link", at: 10.82, y: 500, x: 130, align: "left" },
      { text: "покажу", role: "extra", at: 11.35, y: 470, x: 1000, align: "right" },
    ],
  },
  {
    to: 14.79,
    words: [
      { text: "небольшой", role: "link", at: 12.06, y: 610, x: 130, align: "left" },
      { text: "обзор", role: "key", at: 12.86, y: 670 },
      { text: "квартиры", role: "extra", at: 14.24, y: 590, x: 1010, align: "right", size: 80 },
    ],
  },
  {
    to: 16.32,
    words: [
      { text: "смотрите", role: "extra", at: 14.79, y: 560, x: 1045, align: "right", size: 84 },
      { text: "здесь у нас", role: "link", at: 15.43, y: 660, x: 1010, align: "right" },
    ],
  },
  {
    to: 18.68,
    words: [
      { text: "коридор", role: "key", at: 16.32, y: 580, size: 210 },
      { text: "достаточно большой", role: "extra", at: 17.0, y: 500, x: 1010, align: "right", size: 72 },
    ],
  },
  {
    to: 20.06,
    words: [
      { text: "дальше", role: "link", at: 18.68, y: 560, x: 150, align: "left" },
      { text: "мы идём", role: "extra", at: 19.26, y: 620 },
    ],
  },
  {
    to: 21.71,
    words: [
      { text: "здесь", role: "link", at: 20.06, y: 590, x: 90, align: "left" },
      { text: "Кухня", role: "key", at: 20.37, y: 640 },
      { text: "гостиная", role: "extra", at: 20.9, y: 560, x: 1010, align: "right", size: 80 },
    ],
  },
  {
    to: 23.5,
    words: [
      { text: "тоже", role: "link", at: 21.71, y: 680, x: 140, align: "left" },
      { text: "большая", role: "key", at: 22.11, y: 730, size: 210 },
    ],
  },
  {
    to: 26.26,
    words: [
      { text: "которую хотят", role: "link", at: 23.5, y: 640, x: 130, align: "left" },
      { text: "переделать", role: "key", at: 25.5, y: 690, size: 170 },
    ],
  },
  {
    to: 28.72,
    words: [
      { text: "если о переделках", role: "link", at: 26.26, y: 560, x: 1010, align: "right" },
      { text: "что хотят делать", role: "extra", at: 27.16, y: 620, x: 1010, align: "right", size: 66 },
    ],
  },
  {
    to: MUTABAR2_SECONDS,
    words: [
      { text: "убрать", role: "extra", at: 28.72, y: 560, x: 1010, align: "right", size: 80 },
      { text: "стенку", role: "key", at: 29.75, y: 670 },
    ],
  },
];

const Words: React.FC<{ behind: boolean }> = ({ behind }) => (
  <>
    {GROUPS.flatMap((g) =>
      g.words
        .filter((w) => (w.role === "key") === behind)
        .map((w) => (
          <KineticWord
            key={`${w.at}-${w.text}`}
            text={w.text}
            role={w.role}
            at={w.at}
            until={g.to}
            y={w.y}
            x={w.x}
            align={w.align}
            size={w.size}
            color={w.color ?? (w.role === "key" ? ACCENT : w.at < OUTDOOR_UNTIL ? "#FFFFFF" : INK)}
            shadow={w.role !== "key" && w.at < OUTDOOR_UNTIL}
          />
        )),
    )}
  </>
);

// Медленное приближение 1,00 → 1,04 в пределах плана; на склейке сбрасывается незаметно
const useZoom = () => {
  const t = useCurrentFrame() / MUTABAR2_FPS;
  const i = CUTS.findIndex((c, k) => t >= c && t < (CUTS[k + 1] ?? Infinity));
  const a = CUTS[i];
  const b = CUTS[i + 1] ?? MUTABAR2_SECONDS;
  return interpolate(t, [a, b], [1, 1.04]);
};

// Лёгкая цветокоррекция по STYLE.md — одинаковая для исходника и маски, иначе спикер будет отличаться
const GRADE = "contrast(1.08) saturate(1.08)";

export const Mutabar2: React.FC = () => {
  const frame = useCurrentFrame();
  const total = Math.round(MUTABAR2_SECONDS * MUTABAR2_FPS);
  const zoom = useZoom();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <AbsoluteFill style={{ filter: GRADE }}>
          <OffthreadVideo
            src={SRC}
            volume={interpolate(frame, [total - 8, total], [1, 0], { extrapolateLeft: "clamp" })}
          />
        </AbsoluteFill>
        <Words behind />
        {/* Видео маски — в AbsoluteFill, иначе абсолютные слова рисуются поверх него */}
        <AbsoluteFill style={{ filter: GRADE }}>
          <OffthreadVideo src={MATTE} transparent muted />
        </AbsoluteFill>
        <Words behind={false} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
