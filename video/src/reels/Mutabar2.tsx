import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { KineticWord, Role } from "../components/Kinetic";
import { Sound } from "../releases/mutabar/Sound";
import { wordStart } from "../releases/mutabar/timing";

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
  // Номер слова из words-timing.json; delay — сдвиг внутри длинного слова («кухня-гостиная»)
  at: string;
  delay?: number;
  y: number;
  x?: number;
  align?: "center" | "left" | "right";
  size?: number;
  color?: string;
};
type Group = { words: W[] };

// Секунды берутся только из words-timing.json: группа живёт до первого слова следующей
const atSec = (w: W) => wordStart(w.at) + (w.delay ?? 0);
const groupEnd = (i: number) => (GROUPS[i + 1] ? atSec(GROUPS[i + 1].words[0]) : MUTABAR2_SECONDS);

// Ключевое слово — за головой: верх слова ≈ макушка − 0,3 размера (макушки — tools/heads.py).
// Связка — над ключевым слева, дополнение — справа на уровне плеч, чтобы не закрывать лицо
const GROUPS: Group[] = [
  {
    words: [
      { text: "передаю", role: "link", at: "n001", y: 350, x: 170, align: "left" },
      { text: "ключи", role: "key", at: "n002", y: 400, x: 750, size: 190 },
      { text: "от квартиры", role: "link", at: "n003", y: 350, x: 1000, align: "right" },
    ],
  },
  {
    words: [
      { text: "документы", role: "key", at: "n005", y: 500, x: 470, size: 150 },
    ],
  },
  {
    words: [
      { text: "приобрели", role: "link", at: "n006", y: 470, x: 110, align: "left" },
      { text: "евродвушку", role: "key", at: "n007", y: 520, size: 150 },
    ],
  },
  {
    words: [
      { text: "56", role: "key", at: "n008", y: 470, x: 470, size: 300 },
      { text: "м²", role: "extra", at: "n009", y: 560, x: 660, align: "left", size: 130, color: ACCENT },
    ],
  },
  {
    words: [
      { text: "с ежемесячным", role: "link", at: "n011", y: 440, x: 110, align: "left" },
      { text: "платежом", role: "extra", at: "n013", y: 470, x: 1000, align: "right", size: 80 },
      { text: "69 000", role: "key", at: "n014", y: 520, size: 220 },
    ],
  },
  {
    words: [
      { text: "пойдёмте", role: "link", at: "n015", y: 500, x: 130, align: "left" },
      { text: "покажу", role: "extra", at: "n016", y: 470, x: 1000, align: "right" },
    ],
  },
  {
    words: [
      { text: "небольшой", role: "link", at: "n018", y: 610, x: 130, align: "left" },
      { text: "обзор", role: "key", at: "n019", y: 670 },
      { text: "квартиры", role: "extra", at: "n021", y: 590, x: 1010, align: "right", size: 80 },
    ],
  },
  {
    words: [
      { text: "смотрите", role: "extra", at: "n022", y: 560, x: 1045, align: "right", size: 84 },
      { text: "здесь у нас", role: "link", at: "n023", y: 660, x: 1010, align: "right" },
    ],
  },
  {
    words: [
      { text: "коридор", role: "key", at: "n026", y: 580, size: 210 },
      { text: "достаточно большой", role: "extra", at: "n027", y: 500, x: 1010, align: "right", size: 72 },
    ],
  },
  {
    words: [
      { text: "дальше", role: "link", at: "n029", y: 560, x: 150, align: "left" },
      { text: "мы идём", role: "extra", at: "n030", y: 620 },
    ],
  },
  {
    words: [
      { text: "здесь", role: "link", at: "n032", y: 590, x: 90, align: "left" },
      { text: "Кухня", role: "key", at: "n033", y: 640 },
      { text: "гостиная", role: "extra", at: "n033", delay: 0.5, y: 560, x: 1010, align: "right", size: 80 },
    ],
  },
  {
    words: [
      { text: "тоже", role: "link", at: "n034", y: 680, x: 140, align: "left" },
      { text: "большая", role: "key", at: "n035", y: 730, size: 210 },
    ],
  },
  {
    words: [
      { text: "которую хотят", role: "link", at: "n037", y: 640, x: 130, align: "left" },
      { text: "переделать", role: "key", at: "n042", y: 690, size: 170 },
    ],
  },
  {
    words: [
      { text: "если о переделках", role: "link", at: "n043", y: 560, x: 1010, align: "right" },
      { text: "что хотят делать", role: "extra", at: "n046", y: 620, x: 1010, align: "right", size: 66 },
    ],
  },
  {
    words: [
      { text: "убрать", role: "extra", at: "n051", y: 560, x: 1010, align: "right", size: 80 },
      { text: "стенку", role: "key", at: "n054", y: 670 },
    ],
  },
];

const Words: React.FC<{ behind: boolean }> = ({ behind }) => (
  <>
    {GROUPS.flatMap((g, i) =>
      g.words
        .filter((w) => (w.role === "key") === behind)
        .map((w) => (
          <KineticWord
            key={`${w.at}-${w.text}`}
            text={w.text}
            role={w.role}
            at={atSec(w)}
            until={groupEnd(i)}
            y={w.y}
            x={w.x}
            align={w.align}
            size={w.size}
            color={w.color ?? (w.role === "key" ? ACCENT : atSec(w) < OUTDOOR_UNTIL ? "#FFFFFF" : INK)}
            shadow={w.role !== "key" && atSec(w) < OUTDOOR_UNTIL}
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
      <Sound total={total} />
    </AbsoluteFill>
  );
};
