import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { KineticWord, Role } from "../../components/Kinetic";
import { DataCard } from "../jak/DataCard";
import { C, LABEL_FONT, SCRIPT_FONT } from "../jak/theme";
import { AreaSquare } from "./Sketch";
import { at } from "./timing";

// Хук на улице (0–12,6 с): ключевые слова за героями (маска mutabar.webm — исходник 0–30,4 с, сдвиг 0)
type W = { text: string; role: Role; at: string; y: number; x?: number; align?: "center" | "left" | "right"; size?: number };
type G = { until: number | string; words: W[] };

const GROUPS: G[] = [
  {
    until: "n005",
    words: [
      { text: "передаю", role: "link", at: "n001", y: 330, x: 170, align: "left" },
      { text: "ключи", role: "key", at: "n002", y: 390, x: 760, size: 170 },
      { text: "от квартиры", role: "link", at: "n003", y: 330, x: 1000, align: "right" },
    ],
  },
  { until: "n006", words: [{ text: "документы", role: "key", at: "n005", y: 470, x: 480, size: 130 }] },
  {
    until: 6.45,
    words: [
      { text: "приобрели", role: "link", at: "n006", y: 440, x: 120, align: "left" },
      { text: "евродвушку", role: "key", at: "n007", y: 500, size: 118 },
    ],
  },
  {
    until: 12.6,
    words: [
      { text: "пойдёмте", role: "link", at: "n016", y: 470, x: 130, align: "left" },
      { text: "покажу", role: "extra", at: "n017", y: 520, x: 980, align: "right" },
    ],
  },
];

const untilSec = (u: number | string) => (typeof u === "number" ? u : at(u));

const Words: React.FC<{ behind: boolean }> = ({ behind }) => (
  <>
    {GROUPS.flatMap((g) =>
      g.words
        .filter((w) => (w.role === "key") === behind)
        .map((w) => (
          <KineticWord
            key={w.at + w.text}
            text={w.text}
            role={w.role}
            at={at(w.at)}
            until={untilSec(g.until)}
            y={w.y}
            x={w.x}
            align={w.align}
            size={w.size ?? (w.role === "link" ? 64 : undefined)}
            color={w.role === "key" ? C.yellow : C.white}
            shadow={w.role !== "key"}
            font={w.role === "link" ? SCRIPT_FONT : LABEL_FONT}
            weight={w.role === "link" ? 400 : 800}
          />
        )),
    )}
  </>
);

export const Hook: React.FC = () => (
  <AbsoluteFill>
    <Words behind />
    <AbsoluteFill>
      <OffthreadVideo src={staticFile("mattes/mutabar.webm")} transparent muted />
    </AbsoluteFill>
    <Words behind={false} />
    <AreaSquare from={at("n008")} to={8.2} cx={548} cy={980} value={56} size={330} />
    <DataCard
      from={8.2}
      to={10.8}
      box={{ x: 140, y: 1290, w: 800, h: 270 }}
      steps={[{ at: 8.2, label: "ежемесячный платёж", value: 69000, suffix: " ₽", valueAt: at("n014") }]}
    />
  </AbsoluteFill>
);
