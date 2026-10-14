import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { KineticWord, Role } from "../../components/Kinetic";
import { C, LABEL_FONT, SCRIPT_FONT } from "../jak/theme";
import { at } from "./timing";

// Кинетические слова с маской: ключевые — жёлтые за спикером, связки — рукописные белые поверх.
// Используется на входе в квартиру («небольшой / обзор») и в заключении.
export type KW = { text: string; role: Role; at: string; y: number; x?: number; align?: "center" | "left" | "right"; size?: number };
export type KG = { from?: number; until: number | string; words: KW[] };

const untilSec = (u: number | string) => (typeof u === "number" ? u : at(u));

const Words: React.FC<{ groups: KG[]; behind: boolean }> = ({ groups, behind }) => (
  <>
    {groups.flatMap((g) =>
      g.words
        .filter((w) => (w.role === "key") === behind)
        .map((w) => (
          <KineticWord
            key={w.at + w.text}
            text={w.text}
            role={w.role}
            at={Math.max(at(w.at), g.from ?? 0)}
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

// Время слов — от начала ролика (не оборачивать в Sequence). Маска подключается только на окне [from, to):
// matte — вырезанный спикер (tools/matte.py), rawStart — где он начинается в исходнике, offset — сдвиг куска монтажа
export const MaskedWords: React.FC<{
  groups: KG[];
  matte: { src: string; rawStart: number };
  offset: number;
  from: number;
  to: number;
}> = ({ groups, matte, offset, from, to }) => {
  const { fps } = useVideoConfig();
  const start = Math.round(from * fps);
  const trim = Math.round((from + offset - matte.rawStart) * fps);
  return (
    <AbsoluteFill>
      <Words groups={groups} behind />
      <Sequence from={start} durationInFrames={Math.round(to * fps) - start} layout="none">
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(matte.src)} transparent muted trimBefore={trim > 0 ? trim : undefined} />
        </AbsoluteFill>
      </Sequence>
      <Words groups={groups} behind={false} />
    </AbsoluteFill>
  );
};

// Вход в квартиру: «небольшой / обзор» (голова на 12,6–14 с — макушка ≈ 700–780)
export const OVERVIEW: KG[] = [
  {
    from: 12.62,
    until: "n023",
    words: [
      { text: "небольшой", role: "link", at: "n019", y: 600, x: 140, align: "left" },
      { text: "обзор", role: "key", at: "n020", y: 650, size: 200 },
      { text: "приобретённой квартиры", role: "link", at: "n021", y: 860, x: 960, align: "right", size: 58 },
    ],
  },
];

// Заключение у стены (70,64–76,48 с): макушка ≈ 400–470, x ≈ 410–590
export const ENDING: KG[] = [
  {
    from: 70.66,
    until: "n137",
    words: [
      { text: "хотите", role: "link", at: "n135", y: 250, x: 150, align: "left" },
      { text: "приобрести", role: "key", at: "n136", y: 320, size: 150 },
    ],
  },
  {
    until: "n141",
    words: [
      { text: "такое же", role: "link", at: "n137", y: 250, x: 150, align: "left" },
      { text: "своё жильё", role: "key", at: "n139", y: 320, size: 140 },
    ],
  },
  {
    until: 76.48,
    words: [{ text: "и мы вам поможем", role: "link", at: "n146", y: 300, align: "center", size: 70 }],
  },
];
