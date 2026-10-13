import { Audio } from "@remotion/media";
import { interpolate, staticFile } from "remotion";

// Слой звуковых эффектов с приглушением под голос (урок 12). Общий для всех выпусков.
const db = (value: number) => Math.pow(10, value / 20);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Громкость эффектов относительно файла библиотеки (подстраивать на слух)
const UNDER_SPEECH_DB: Record<number, number> = { 1: -8, 2: -10, 3: -12 };
const PAUSE_DB = -5;
// Приглушение начинается за 0,08 с до слова и отпускает через 0,22 с после
const ATTACK_SEC = 0.08;
const RELEASE_SEC = 0.22;
const FADE_OUT_SEC = 0.08;

export type SfxWord = { start: number; end: number };
export type SfxEvent = {
  id: string;
  at: string;
  lead: number;
  importance: number;
  file: string | null;
  durationSec: number;
};

// 0 — пауза, 1 — звучит слово; слова вплотную не отпускают приглушение
const speechAmount = (words: SfxWord[], sec: number) =>
  words.reduce(
    (m, w) =>
      Math.max(m, interpolate(sec, [w.start - ATTACK_SEC, w.start, w.end, w.end + RELEASE_SEC], [0, 1, 1, 0], clamp)),
    0,
  );

const gainAt = (words: SfxWord[], sec: number, importance: number) => {
  const under = UNDER_SPEECH_DB[importance] ?? UNDER_SPEECH_DB[3];
  return db(PAUSE_DB + (under - PAUSE_DB) * speechAmount(words, sec));
};

export const SfxLayer: React.FC<{
  events: SfxEvent[];
  words: (SfxWord & { id: string })[];
  fps: number;
  total: number;
}> = ({ events, words, fps, total }) => {
  const byId = new Map(words.map((w) => [w.id, w]));
  return (
    <>
      {events.map((e) => {
        const w = byId.get(e.at);
        if (!w) throw new Error(`Звук ${e.id}: нет слова ${e.at}`);
        if (!e.file) throw new Error(`Звук ${e.id}: файл не выбран`);
        const start = Math.round((w.start + e.lead) * fps);
        // Старт раньше нуля — отрезаем начало файла
        const from = Math.max(0, start);
        const trimBefore = from - start;
        const duration = Math.min(Math.round(e.durationSec * fps) - trimBefore, total - from);
        const fade = Math.round(FADE_OUT_SEC * fps);
        return (
          <Audio
            key={e.id}
            src={staticFile(`sfx/${e.file}`)}
            from={from}
            durationInFrames={duration}
            trimBefore={trimBefore || undefined}
            // f отсчитывается от начала клипа, а не от начала ролика — проверено тестом (VolTest, 13.10.2026)
            volume={(f) =>
              gainAt(words, (from + f) / fps, e.importance) * interpolate(f, [duration - fade, duration], [1, 0], clamp)
            }
          />
        );
      })}
    </>
  );
};
