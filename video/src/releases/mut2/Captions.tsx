import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, SCRIPT_FONT } from "../jak/theme";
import { WORDS } from "./timing";

// Субтитры обзора в стиле монтажа: 1–3 слова по центру, белые; ключевые — жёлтые с рукописной второй строкой.
// Слова идут строго по очереди: следующая фраза сменяет предыдущую без наплыва (правка jak 14.10.2026).
type Cap = { from: number; to: number; text: string; sub?: string; key?: boolean };

// Короткие служебные слова приклеиваются к следующему слову
const GLUE = new Set(["у", "с", "о", "и", "в", "на", "же", "мы", "вы", "вот", "это", "так", "что", "они", "нас", "вам"]);
// Ключевые слова: жёлтые, со второй рукописной строкой (как во вшитых субтитрах монтажа)
const KEYS: Record<string, { text: string; sub?: string; until?: string }> = {
  n027: { text: "коридор", sub: "достаточно большой", until: "n030" },
  n034: { text: "кухня", sub: "гостиная" },
  n043: { text: "переделать" },
  n055: { text: "стенку" },
  n060: { text: "перегородить" },
  n062: { text: "отдельную", sub: "комнату", until: "n064" },
  n071: { text: "просторная", sub: "кухня" },
  n074: { text: "прихожей" },
  n080: { text: "санузел", sub: "большой", until: "n082" },
  n083: { text: "совмещённый" },
  n095: { text: "гардеробная" },
  n097: { text: "вместительная" },
  n103: { text: "огромная", sub: "родительская комната", until: "n106" },
  n113: { text: "балкон" },
  n120: { text: "школа" },
  n123: { text: "парковочные", sub: "места", until: "n125" },
  n125: { text: "огромное", sub: "количество", until: "n127" },
};

const clean = (s: string) => s.replace(/[.,!?:;«»"]/g, "").toLowerCase();

export const buildCaptions = (from: number, to: number, skip: [number, number][]): Cap[] => {
  const words = WORDS.filter((w) => w.start >= from - 0.01 && w.start < to);
  const idx = new Map(WORDS.map((w, i) => [w.id, i]));
  const caps: Cap[] = [];
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    const k = KEYS[w.id];
    if (k) {
      const untilIdx = k.until ? idx.get(k.until)! : idx.get(w.id)! + 1;
      const end = WORDS[untilIdx]?.start ?? to;
      caps.push({ from: w.start, to: end, text: k.text, sub: k.sub, key: true });
      while (i < words.length && idx.get(words[i].id)! < untilIdx) i++;
      continue;
    }
    // Служебные слова + следующее слово — одной фразой (не больше трёх слов)
    const parts = [clean(w.show ?? w.text)];
    let j = i + 1;
    while (GLUE.has(parts[parts.length - 1]) && j < words.length && !KEYS[words[j].id] && parts.length < 3) {
      parts.push(clean(words[j].show ?? words[j].text));
      j++;
    }
    const next = words[j];
    caps.push({ from: w.start, to: next ? next.start : Math.min(to, words[j - 1].end + 0.4), text: parts.join(" ") });
    i = j;
  }
  // Пауза в речи — фраза держится не дольше 0,5 с после конца слова; места под отдельную графику — без субтитров
  return caps
    .map((c) => ({ ...c, to: Math.min(c.to, c.from + 2.4) }))
    .filter((c) => !skip.some(([a, b]) => c.from < b && c.to > a))
    .map((c) => ({ ...c, from: Math.max(c.from, from), to: Math.min(c.to, to) }));
};

export const Captions: React.FC<{ caps: Cap[]; y?: number }> = ({ caps, y = 1330 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = caps.find((x) => t >= x.from && t < x.to);
  if (!c) return null;
  const k = interpolate(t - c.from, [0, 0.16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shadow = "0 4px 22px rgba(0,0,0,0.45)";
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 40,
        right: 40,
        textAlign: "center",
        opacity: k,
        transform: `translateY(${(1 - k) * 14}px) scale(${0.94 + 0.06 * k})`,
        textShadow: shadow,
      }}
    >
      <div
        style={{
          fontFamily: LABEL_FONT,
          fontWeight: 800,
          fontSize: c.key ? 96 : 78,
          lineHeight: 1.02,
          color: c.key ? C.yellow : C.white,
        }}
      >
        {c.text}
      </div>
      {c.sub ? (
        <div style={{ fontFamily: SCRIPT_FONT, fontSize: 58, lineHeight: 1, color: C.white, marginTop: -6 }}>{c.sub}</div>
      ) : null}
    </div>
  );
};
