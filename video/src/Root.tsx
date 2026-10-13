import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Mutabar, MUTABAR_FPS, MUTABAR_SECONDS } from "./reels/Mutabar";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="Mutabar"
        component={Mutabar}
        durationInFrames={Math.round(MUTABAR_SECONDS * MUTABAR_FPS)}
        fps={MUTABAR_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
