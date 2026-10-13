import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { KineticWord } from "../components/Kinetic";

// Проба маски: 20,0–24,4 с исходника Mutabar, «здесь кухня-гостиная тоже большая»
export const MASK_TEST_FPS = 25;
export const MASK_TEST_START = 20.0;
export const MASK_TEST_SECONDS = 4.4;

const SRC = staticFile("мутабар лила обзор  - (9x16).mp4");
const MATTE = staticFile("mattes/kitchen.webm");

// Светлые бетонные стены: белый текст теряется, поэтому ключевые — акцент (тёплый красный
// из кадра — губы, кабели на полу), связки — графит
const ACCENT = "#E4473B";
const INK = "#1B1B1B";

// Время слов — от начала пробы (секунды исходника минус 20,0)
const G1 = { from: 0.06, to: 1.71 };
const G2 = { from: 1.71, to: MASK_TEST_SECONDS };

// Слова за спикером
const Behind: React.FC = () => (
  <>
    <KineticWord text="Кухня" role="key" at={0.37} until={G1.to} y={640} color={ACCENT} shadow={false} />
    <KineticWord text="большая" role="key" at={2.11} until={G2.to} y={730} size={210} color={ACCENT} shadow={false} />
  </>
);

// Слова перед спикером
const Front: React.FC = () => (
  <>
    <KineticWord text="здесь" role="link" at={G1.from} until={G1.to} y={590} x={250} align="left" color={INK} shadow={false} />
    <KineticWord text="гостиная" role="extra" at={0.9} until={G1.to} y={880} x={1030} align="right" color={INK} shadow={false} />
    <KineticWord text="тоже" role="link" at={G2.from} until={G2.to} y={680} x={140} align="left" color={INK} shadow={false} />
  </>
);

export const MaskTest: React.FC = () => {
  const trim = Math.round(MASK_TEST_START * MASK_TEST_FPS);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <OffthreadVideo src={SRC} trimBefore={trim} />
      </AbsoluteFill>
      <Behind />
      {/* Спикер, вырезанный tools/matte.py, лежит точно поверх исходника.
          Видео — в AbsoluteFill: иначе абсолютные слова рисуются поверх него */}
      <AbsoluteFill>
        <OffthreadVideo src={MATTE} transparent muted />
      </AbsoluteFill>
      <Front />
    </AbsoluteFill>
  );
};
