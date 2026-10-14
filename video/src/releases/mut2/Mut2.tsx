import { Audio } from "@remotion/media";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { Hook } from "./Hook";
import planeFloor from "./plane-floor.json";
import planeSchool from "./plane-school.json";
import planeWall from "./plane-wall.json";
import { at, FPS, SECONDS, SEGMENTS, toFrame } from "./timing";
import { TrackedCallout, WallPlan } from "./Tracked";

// Картинка — из исходника без графики по кускам монтажа; звук — из монтажа целиком
const RAW = staticFile("мутабар лила обзор  - (9x16)_исход.mp4");
const MONTAGE = staticFile("мутабар лила обзор  - (9x16)_мотаж.mp4");

export const MUT2_FPS = FPS;
export const MUT2_SECONDS = SECONDS;

export const Mut2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SEGMENTS.map((s) => (
      <Sequence key={s.from} from={toFrame(s.from)} durationInFrames={toFrame(s.to) - toFrame(s.from)}>
        <OffthreadVideo src={RAW} muted trimBefore={toFrame(s.from + s.offset)} />
      </Sequence>
    ))}
    <Audio src={MONTAGE} />

    <Sequence durationInFrames={toFrame(12.6)} layout="none">
      <Hook />
    </Sequence>

    <WallPlan
      from={at("n052")}
      crossAt={at("n055")}
      lineAt={at("n060")}
      labelAt={at("n062")}
      to={35.0}
      offset={0}
      wall={{ track: planeWall, quad: [[340, 440], [1090, 35], [1090, 1565], [345, 1180]] }}
      floor={{ track: planeFloor, line: [[700, 1370], [330, 1880]] }}
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
  </AbsoluteFill>
);
