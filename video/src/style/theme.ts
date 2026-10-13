import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadUnbounded } from "@remotion/google-fonts/Unbounded";

// Оба шрифта содержат cyrillic-ext — буквы uz/ky/tg
const subsets = ["latin", "cyrillic", "cyrillic-ext"] as const;

export const DISPLAY_FONT = loadUnbounded("normal", {
  weights: ["700", "800"],
  subsets: [...subsets],
}).fontFamily;

export const TEXT_FONT = loadManrope("normal", {
  weights: ["600", "700", "800"],
  subsets: [...subsets],
}).fontFamily;

export const COLORS = {
  accent: "#FF5A1F",
  ink: "#141414",
  paper: "#F7F5F0",
  muted: "#6B6B6B",
  white: "#FFFFFF",
};

export const SHADOW = "0 18px 50px rgba(0, 0, 0, 0.28)";

// Отступ сверху для графики: ниже интерфейса Reels/TikTok, выше лиц в кадре
export const TOP_SAFE = 190;
export const SIDE = 64;
