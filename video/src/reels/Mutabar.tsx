import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Captions, Word } from "../components/Captions";
import { FactsCard, KeyTag, ProgressBar, RemodelCard, RoomTag, SectionTitle } from "../components/Graphics";

// Исходник 1080×1920, 25 fps. Берём первые 30,4 с — до конца фразы «убрать вот эту стенку»
export const MUTABAR_FPS = 25;
export const MUTABAR_SECONDS = 30.4;
const SRC = staticFile("мутабар лила обзор  - (9x16).mp4");
const HEIGHT = 1920;

const f = (sec: number) => Math.round(sec * MUTABAR_FPS);

// Распознано whisper.cpp (large-v3-turbo q5_0), текст выверен: ё, «евродвушку», «69 000».
// [слово, начало, конец] по фразам субтитров
const PHRASES: [string, number, number][][] = [
  [["Передаю", 0.05, 0.63], ["ключи", 0.63, 1.13]],
  [["от", 1.13, 1.26], ["квартиры,", 1.26, 2.07], ["документы", 2.07, 3.0]],
  [["Приобрели", 3.0, 4.53], ["евродвушку", 4.53, 6.24]],
  [["56", 6.24, 7.27], ["квадратных", 7.27, 7.74], ["метров", 7.74, 8.16]],
  [["с", 8.16, 8.23], ["ежемесячным", 8.23, 8.92], ["платежом", 8.92, 9.54]],
  [["69 000", 9.54, 10.82]],
  [["Пойдёмте,", 10.82, 11.35], ["покажу", 11.35, 11.82], ["вам", 11.82, 12.06]],
  [["небольшой", 12.06, 12.86], ["обзор", 12.86, 13.15]],
  [["приобретённой", 13.15, 14.24], ["квартиры", 14.24, 14.79]],
  [["Смотрите,", 14.79, 15.43], ["здесь", 15.43, 15.96], ["у", 15.96, 16.02], ["нас", 16.02, 16.32]],
  [["коридор", 16.32, 17.0], ["достаточно", 17.0, 18.09], ["большой", 18.09, 18.68]],
  [["Дальше", 18.68, 19.26], ["мы", 19.26, 19.47], ["идём", 19.47, 20.06]],
  [["здесь", 20.06, 20.37], ["кухня-гостиная", 20.37, 21.71]],
  [["тоже", 21.71, 22.11], ["большая", 22.11, 22.93], ["идёт,", 22.93, 23.5]],
  [["которую", 23.5, 24.36], ["они", 24.36, 24.56], ["хотят", 24.56, 24.89]],
  [["конечно", 24.89, 25.36], ["же", 25.36, 25.5], ["переделать", 25.5, 26.26]],
  [["Если", 26.26, 26.43], ["о", 26.43, 26.49], ["переделках —", 26.49, 27.16]],
  [["что", 27.16, 27.36], ["они", 27.36, 27.56], ["хотят", 27.56, 27.89], ["здесь", 27.89, 28.4], ["делать:", 28.4, 28.72]],
  [["убрать", 28.72, 29.28], ["вот", 29.28, 29.68], ["эту", 29.68, 29.75], ["стенку", 29.75, 30.38]],
];

const WORDS: Word[] = PHRASES.flatMap((p, phrase) =>
  p.map(([text, start, end]) => ({ text, start, end, phrase })),
);

// Плавное приближение кадра в ключевые моменты (цифры, «убрать стенку»)
const PUNCH_INS = [6.24, 9.54, 28.72];

const useZoom = () => {
  const frame = useCurrentFrame();
  return PUNCH_INS.reduce((scale, sec) => {
    const s = f(sec);
    return (
      scale +
      interpolate(frame, [s, s + 8, s + 30, s + 40], [0, 0.07, 0.07, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }, 1);
};

// Графика на отрезке [from, to] секунд; dur — длина в кадрах для анимации ухода
const At: React.FC<{ from: number; to: number; children: (dur: number) => React.ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const dur = f(to) - f(from);
  return (
    <Sequence from={f(from)} durationInFrames={dur} layout="none">
      {children(dur)}
    </Sequence>
  );
};

export const Mutabar: React.FC = () => {
  const frame = useCurrentFrame();
  const total = f(MUTABAR_SECONDS);
  const zoom = useZoom();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo
          src={SRC}
          volume={interpolate(frame, [total - 8, total], [1, 0], { extrapolateLeft: "clamp" })}
        />
      </AbsoluteFill>

      <At from={0.05} to={3.0}>{(dur) => <KeyTag dur={dur} />}</At>
      <At from={4.53} to={10.82}>
        {(dur) => (
          <FactsCard
            dur={dur}
            areaAt={0}
            areaCountAt={f(6.24 - 4.53)}
            paymentAt={f(8.16 - 4.53)}
            paymentCountAt={f(9.54 - 4.53)}
          />
        )}
      </At>
      <At from={10.82} to={14.79}>{(dur) => <SectionTitle dur={dur} lines={["ОБЗОР", "КВАРТИРЫ"]} />}</At>
      <At from={16.32} to={20.06}>{(dur) => <RoomTag dur={dur} name="Коридор" note="достаточно большой" />}</At>
      <At from={20.37} to={24.36}>{(dur) => <RoomTag dur={dur} name="Кухня-гостиная" note="тоже большая" />}</At>
      <At from={25.5} to={MUTABAR_SECONDS}>{(dur) => <RemodelCard dur={dur} strikeAt={f(28.72 - 25.5)} />}</At>

      {/* Низ субтитров на 20 % высоты от нижнего края — выше минимума 12 % */}
      <Captions words={WORDS} endSec={MUTABAR_SECONDS} bottom={HEIGHT * 0.2} />
      <ProgressBar />
    </AbsoluteFill>
  );
};
