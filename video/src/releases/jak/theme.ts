import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadAlternates } from "@remotion/google-fonts/MontserratAlternates";
import { loadFont as loadScript } from "@remotion/google-fonts/MarckScript";

// Стиль выпуска «жак эксперт» — как во вшитой графике исходника:
// жёлтые подписи жирным гротеском, белые цифры, чёрные плашки. Только чёрный, белый, жёлтый (правка 14.10.2026)
const subsets = ["latin", "cyrillic"] as const;

export const LABEL_FONT = loadAlternates("normal", { weights: ["800"], subsets: [...subsets] }).fontFamily;
export const NUM_FONT = loadMontserrat("normal", { weights: ["600", "700", "800", "900"], subsets: [...subsets] }).fontFamily;
export const SCRIPT_FONT = loadScript("normal", { weights: ["400"], subsets: [...subsets] }).fontFamily;

export const C = {
  yellow: "#F5DC05",
  plate: "#181818",
  white: "#FFFFFF",
};

