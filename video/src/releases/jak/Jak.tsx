import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SfxLayer } from "../../components/SfxLayer";
import { DataCard } from "./DataCard";
import { DrawNumber } from "./DrawNumber";
import { ChapterTag, CommentCta, TopChip, useCameraFx, VsCard } from "./Extras";
import plan from "./sound-plan.json";
import { Text3D } from "./Text3D";
import { C, LABEL_FONT } from "./theme";
import { at, FPS, SECONDS, toFrame, WORDS } from "./timing";

// «жак эксперт»: готовый ролик со вшитой графикой. Плашки с суммами закрываются новыми карточками
// (рамки — tools/overlays.py и кадры), сверху — метки разделов, 3D «312», рукописная «26», динамика склеек.
export const JAK_FPS = FPS;
export const JAK_SECONDS = SECONDS;

const SRC = staticFile("jak-1080.mp4");

// Склейки исходника (ffmpeg scene > 0,15), без «двойных» кадров-вспышек
const CUTS = [5.205, 10.577, 11.912, 15.782, 17.484, 24.625, 25.959, 28.896, 37.137, 42.075, 46.513, 52.953, 56.823];
const PUNCHES = ["n007", "n033", "n118", "n127", "n137", "n183"].map(at);
const SHAKES = [at("n110")];

const BIG = { x: 40, y: 1190, w: 1000, h: 370 };

export const Jak: React.FC = () => {
  const frame = useCurrentFrame();
  const total = toFrame(SECONDS);
  const cam = useCameraFx(CUTS, PUNCHES, SHAKES);
  const planetaIn = interpolate(frame / FPS, [at("n137"), at("n137") + 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Видео и карточки поверх вшитых плашек двигаются вместе: иначе при «ударе» старая плашка вылезет из-под новой */}
      <AbsoluteFill style={{ transform: cam.transform, filter: cam.filter }}>
        <AbsoluteFill>
          <OffthreadVideo src={SRC} volume={interpolate(frame, [total - 6, total], [1, 0], { extrapolateLeft: "clamp" })} />
        </AbsoluteFill>

        <DataCard
          from={1.85}
          to={3.35}
          box={{ x: 90, y: 1200, w: 900, h: 240 }}
          steps={[{ at: 1.85, label: "переплата в год", value: 312000, suffix: " ₽", valueAt: at("n007"), color: C.red }]}
        />
        <VsCard from={6.45} to={8.78} box={{ x: 110, y: 1290, w: 860, h: 270 }} leftAt={at("n021")} vsAt={at("n023")} rightAt={at("n025")} />
        <DataCard
          from={16.85}
          to={24.62}
          exitAnim={false}
          box={BIG}
          chip="ЛЬГОТНАЯ · 12%"
          steps={[
            { at: 16.85, label: "условие", text: "ребёнок до 7 лет" },
            { at: at("n054"), label: "стоимость квартиры", value: 13000000, suffix: " ₽", valueAt: at("n056") },
            { at: at("n058"), label: "ежемесячный платёж", value: 107000, suffix: " ₽", valueAt: at("n065") },
            { at: at("n067"), label: "первоначальный взнос", value: 2600000, suffix: " ₽", valueAt: at("n070") },
          ]}
        />
        <DataCard
          from={27.65}
          to={37.12}
          exitAnim={false}
          box={BIG}
          chip="СТАНДАРТНАЯ"
          chipColor={C.white}
          steps={[
            { at: 27.65, label: "стоимость квартиры", value: 8000000, suffix: " ₽", valueAt: at("n081") },
            { at: at("n083"), label: "где", text: "Московская обл." },
            { at: at("n087"), label: "первоначальный взнос", value: 2600000, suffix: " ₽", valueAt: at("n090") },
            { at: at("n093"), label: "ежемесячный платёж", value: 81000, suffix: " ₽", valueAt: at("n102") },
            { at: at("n104"), label: "ставка", value: 18, suffix: " %", valueAt: at("n107") },
          ]}
        />
        <DataCard
          from={37.45}
          to={42.07}
          exitAnim={false}
          box={{ x: 90, y: 1200, w: 900, h: 320 }}
          steps={[
            { at: 37.45, label: "а теперь", text: "ВНИМАНИЕ", color: C.red },
            { at: at("n111"), label: "разница в месяц", value: 26000, suffix: " ₽", valueAt: 39.78, color: C.yellow },
            { at: at("n116"), label: "разница в год", value: 312000, suffix: " ₽", valueAt: at("n118"), color: C.yellow },
          ]}
        />
        <CommentCta from={62.6} to={SECONDS + 1} box={{ x: 110, y: 1250, w: 860, h: 250 }} typeAt={at("n183")} heartAt={63.7} />

        <DrawNumber start={38.6} split={39.1} end={39.6} flyAt={39.62} center={[830, 930]} to={[540, 1390]} />
      </AbsoluteFill>

      {/* Сверху, над головой — не зависит от «ударов» камеры */}
      <ChapterTag from={at("n036") - 0.05} to={15.78} num="ВАРИАНТ 1" text="новостройка" />
      <ChapterTag from={at("n073")} to={28.89} num="ВАРИАНТ 2" text="готовый дом" />

      <Sequence from={toFrame(at("n127") - 0.1)} durationInFrames={toFrame(50.4 - at("n127"))} layout="none">
        <div style={{ position: "absolute", top: 70, left: 0, width: 1080, height: 440 }}>
          <Text3D text="312" color={C.yellow} width={1080} height={440} />
        </div>
      </Sequence>
      {frame / FPS >= at("n137") && frame / FPS < 50.4 ? (
        <div
          style={{
            position: "absolute",
            top: 70,
            width: 1080,
            textAlign: "center",
            fontFamily: LABEL_FONT,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: "0.18em",
            color: C.white,
            textShadow: "0 6px 30px rgba(0,0,0,0.45)",
            opacity: planetaIn,
            transform: `translateY(${(1 - planetaIn) * -30}px)`,
          }}
        >
          ПЛАНЕТА
        </div>
      ) : null}

      <TopChip at={at("n146")} to={52.95} text="вторичный рынок" x={60} y={180} icon="house" />
      <TopChip at={at("n150")} to={52.95} text="первичный рынок" x={60} y={300} icon="house" filled />
      <TopChip at={at("n160")} to={56.82} text="вторичка выгоднее" x={60} y={200} icon="check" filled />
      <TopChip at={at("n170")} to={58.85} text="нет ПВ" x={60} y={200} icon="ask" />

      <SfxLayer events={plan.events} words={WORDS} fps={FPS} total={total} />
    </AbsoluteFill>
  );
};
