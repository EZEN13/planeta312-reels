import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Mut2, MUT2_FPS, MUT2_SECONDS } from "./releases/mut2/Mut2";
import { Jak, JAK_FPS, JAK_SECONDS } from "./releases/jak/Jak";
import { MaskTest, MASK_TEST_FPS, MASK_TEST_SECONDS } from "./reels/MaskTest";
import { Mutabar, MUTABAR_FPS, MUTABAR_SECONDS } from "./reels/Mutabar";
import { Mutabar2, MUTABAR2_FPS, MUTABAR2_SECONDS } from "./reels/Mutabar2";

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
        id="Mutabar2"
        component={Mutabar2}
        durationInFrames={Math.round(MUTABAR2_SECONDS * MUTABAR2_FPS)}
        fps={MUTABAR2_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Jak"
        component={Jak}
        durationInFrames={Math.round(JAK_SECONDS * JAK_FPS)}
        fps={JAK_FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="Mut2"
        component={Mut2}
        durationInFrames={Math.round(MUT2_SECONDS * MUT2_FPS)}
        fps={MUT2_FPS}
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
