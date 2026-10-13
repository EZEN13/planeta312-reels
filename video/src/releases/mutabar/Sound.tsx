import { Audio } from "@remotion/media";
import { interpolate, staticFile } from "remotion";
import plan from "./sound-plan.json";
import { FPS, toFrame, WORDS, wordStart } from "./timing";

const db = (value: number) => Math.pow(10, value / 20);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Громкость эффектов относительно файла библиотеки (урок 12, подстраивать на слух)
const UNDER_SPEECH_DB: Record<number, number> = { 1: -8, 2: -10, 3: -12 };
const PAUSE_DB = -5;
// Приглушение начинается за 0,08 с до слова и отпускает через 0,22 с после
const ATTACK_SEC = 0.08;
const RELEASE_SEC = 0.22;
const FADE_OUT_SEC = 0.08;

// 0 — пауза, 1 — звучит слово; переходы плавные, слова вплотную не отпускают приглушение
export const speechAmount = (sec: number) =>
  WORDS.reduce(
    (m, w) =>
      Math.max(
        m,
        interpolate(sec, [w.start - ATTACK_SEC, w.start, w.end, w.end + RELEASE_SEC], [0, 1, 1, 0], clamp),
      ),
    0,
  );

export const gainAt = (sec: number, importance: number) => {
  const under = UNDER_SPEECH_DB[importance] ?? UNDER_SPEECH_DB[3];
  return db(PAUSE_DB + (under - PAUSE_DB) * speechAmount(sec));
};

type SoundEvent = (typeof plan.events)[number];

const SoundClip: React.FC<{ e: SoundEvent; total: number }> = ({ e, total }) => {
  const start = toFrame(wordStart(e.at) + e.lead);
  // Старт раньше нуля — отрезаем начало файла
  const from = Math.max(0, start);
  const trimBefore = from - start;
  const duration = Math.min(toFrame(e.durationSec) - trimBefore, total - from);
  const fade = toFrame(FADE_OUT_SEC);
  return (
    <Audio
      src={staticFile(`sfx/${e.file}`)}
      from={from}
      durationInFrames={duration}
      trimBefore={trimBefore || undefined}
      // f отсчитывается от начала клипа, а не от начала ролика — проверено тестом (VolTest, 13.10.2026)
      volume={(f) =>
        gainAt((from + f) / FPS, e.importance) * interpolate(f, [duration - fade, duration], [1, 0], clamp)
      }
    />
  );
};

export const Sound: React.FC<{ total: number }> = ({ total }) => (
  <>
    {plan.events.map((e) => (
      <SoundClip key={e.id} e={e} total={total} />
    ))}
  </>
);
