import { SfxLayer } from "../../components/SfxLayer";
import plan from "./sound-plan.json";
import { FPS, WORDS } from "./timing";

export const Sound: React.FC<{ total: number }> = ({ total }) => (
  <SfxLayer events={plan.events} words={WORDS} fps={FPS} total={total} />
);
