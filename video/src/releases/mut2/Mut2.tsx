import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SfxLayer } from "../../components/SfxLayer";
import { CommentCta } from "../jak/Extras";
import { buildCaptions, Captions } from "./Captions";
import { Hook } from "./Hook";
import { ENDING, MaskedWords, OVERVIEW } from "./Kinetic2";
import planeFloor from "./plane-floor.json";
import planeSchool from "./plane-school.json";
import planeWall from "./plane-wall.json";
import plan from "./sound-plan.json";
import { at, FPS, SECONDS, SEGMENTS, toFrame, WORDS } from "./timing";
import { TrackedCallout, WallPlan } from "./Tracked";

// Картинка — из исходника без графики по кускам монтажа; звук — из монтажа целиком
const RAW = staticFile("мутабар лила обзор  - (9x16)_исход.mp4");
const MONTAGE = staticFile("мутабар лила обзор  - (9x16)_мотаж.mp4");

export const MUT2_FPS = FPS;
export const MUT2_SECONDS = SECONDS;

// Склейки монтажа: мягкая вспышка и лёгкий «наезд» вместо вспышек и виньеток исходного монтажа
const CUTS = [12.6, 15.2, 17.2, 20.56, 23.88, 40.76, 47.84, 50.4, 52.8, 55.96, 60.88, 65.72, 70.64];
const ENDING_START = 70.64;

const useCutFx = () => {
  const t = useCurrentFrame() / FPS;
  let scale = 1;
  let bright = 1;
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.5) {
      scale += interpolate(d, [0, 0.45], [0.025, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
      bright += interpolate(d, [0, 0.2], [0.12, 0], { extrapolateRight: "clamp" });
    }
  }
  return { transform: `scale(${scale})`, filter: `brightness(${bright})` };
};

const CAPTIONS = buildCaptions(at("n023"), ENDING_START, []);

export const Mut2: React.FC = () => {
  const fx = useCutFx();
  const total = toFrame(SECONDS);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Видео, маски и привязанные к стенам рисунки двигаются вместе — иначе разъедутся на «наезде» */}
      <AbsoluteFill style={fx}>
        {SEGMENTS.map((s) => (
          <Sequence key={s.from} from={toFrame(s.from)} durationInFrames={toFrame(s.to) - toFrame(s.from)}>
            <OffthreadVideo src={RAW} muted trimBefore={toFrame(s.from + s.offset)} />
          </Sequence>
        ))}

        <Sequence durationInFrames={toFrame(12.6)} layout="none">
          <Hook />
        </Sequence>
        <MaskedWords groups={OVERVIEW} matte={{ src: "mattes/mutabar.webm", rawStart: 0 }} offset={0} from={12.6} to={at("n023")} />

        <WallPlan
          from={at("n052")}
          crossAt={at("n055")}
          lineAt={at("n060")}
          labelAt={at("n062")}
          to={35.0}
          offset={0}
          wall={{ track: planeWall, quad: [[340, 440], [1090, 35], [1090, 1565], [345, 1180]] }}
          floor={{ track: planeFloor, line: [[1113, 1575], [869, 2022]] }}
          matte={{ src: "mattes/mut2-wall.webm", rawStart: 28.6 }}
        />
        <TrackedCallout
          from={at("n120") + 0.1}
          to={65.6}
          offset={6.8}
          plane={planeSchool}
          center={[685, 945]}
          rx={190}
          ry={62}
          label={{ x: 560, y: 600, text: "школа" }}
        />

        <MaskedWords groups={ENDING} matte={{ src: "mattes/mut2-end.webm", rawStart: 81.8 }} offset={11.16} from={ENDING_START} to={SECONDS} />
      </AbsoluteFill>

      <Captions caps={CAPTIONS} />
      <CommentCta
        from={at("n141")}
        to={SECONDS + 1}
        box={{ x: 110, y: 1250, w: 860, h: 250 }}
        typeAt={at("n145")}
        heartAt={75.5}
        text="квартира"
        label="пишите в комментариях"
      />

      <Audio src={MONTAGE} />
      <SfxLayer events={plan.events} words={WORDS} fps={FPS} total={total} />
    </AbsoluteFill>
  );
};
