import timing from "../../../public/releases/mutabar/words-timing.json";

// Единственное место перевода секунд в кадры для выпуска mutabar (исходник 25 fps)
export const FPS = 25;
export const toFrame = (sec: number) => Math.round(sec * FPS);

export type WordId = `n${string}`;
type WordTiming = { id: string; text: string; start: number; end: number; show?: string };

export const WORDS: WordTiming[] = timing.words;
export const AUDIO = timing.audio;

const byId = new Map(WORDS.map((w) => [w.id, w]));

export const word = (id: string): WordTiming => {
  const w = byId.get(id);
  if (!w) throw new Error(`Нет слова ${id} в words-timing.json`);
  return w;
};

export const wordStart = (id: string) => word(id).start;
