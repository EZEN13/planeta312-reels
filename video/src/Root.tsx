import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { MaskTest, MASK_TEST_FPS, MASK_TEST_SECONDS } from "./reels/MaskTest";
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
      <Composition
        id="MaskTest"
        component={MaskTest}
        durationInFrames={Math.round(MASK_TEST_SECONDS * MASK_TEST_FPS)}
        fps={MASK_TEST_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
