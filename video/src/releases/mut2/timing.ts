import timing from "../../../public/releases/mut2/words-timing.json";

// Выпуск mut2 — смонтированный обзор Мутабар (76,48 с, 25 fps). Секунды → кадры только здесь
export const FPS = 25;
export const SECONDS = 76.48;
export const toFrame = (sec: number) => Math.round(sec * FPS);

export const WORDS = timing.words;
const byId = new Map(WORDS.map((w) => [w.id, w]));
export const at = (id: string) => {
  const w = byId.get(id);
  if (!w) throw new Error(`Нет слова ${id} в words-timing.json`);
  return w.start;
};

// Куски монтажа → исходник (сдвиг в секундах), найдено сравнением кадров
export const SEGMENTS: { from: number; to: number; offset: number }[] = [
  { from: 0, to: 47.84, offset: 0 },
  { from: 47.84, to: 52.8, offset: 6.16 },
  { from: 52.8, to: 65.72, offset: 6.8 },
  { from: 65.72, to: 70.64, offset: 8.36 },
  { from: 70.64, to: SECONDS, offset: 11.16 },
];
