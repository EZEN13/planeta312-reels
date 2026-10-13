import timing from "../../../public/releases/jak/words-timing.json";

// Единственное место перевода секунд в кадры для выпуска jak (исходник 29,97 fps)
export const FPS = 30000 / 1001;
export const SECONDS = 64.48;
export const toFrame = (sec: number) => Math.round(sec * FPS);

export const WORDS = timing.words;
const byId = new Map(WORDS.map((w) => [w.id, w]));

export const at = (id: string) => {
  const w = byId.get(id);
  if (!w) throw new Error(`Нет слова ${id} в words-timing.json`);
  return w.start;
};
