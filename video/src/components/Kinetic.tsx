import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KINETIC_FONT } from "../style/theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Role = "key" | "link" | "extra";

// Роли слов по STYLE.md: ключевое — Black, связка — Light, дополнение — SemiBold
const ROLE: Record<Role, { weight: number; size: number; tracking: string }> = {
  key: { weight: 900, size: 230, tracking: "-0.04em" },
  link: { weight: 300, size: 58, tracking: "0" },
  extra: { weight: 600, size: 96, tracking: "-0.02em" },
};

// Слово кинетической типографики: появляется из размытия за 6 кадров, уходит за 4.
// at/until — секунды от начала композиции; x — центр (или left/right), y — верх строки, в px
export const KineticWord: React.FC<{
  text: string;
  role: Role;
  at: number;
  until: number;
  y: number;
  x?: number;
  align?: "center" | "left" | "right";
  color: string;
  size?: number;
  shadow?: boolean;
  font?: string;
  weight?: number;
}> = ({ text, role, at, until, y, x = 540, align = "center", color, size, shadow = true, font, weight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = at * fps;
  const t1 = until * fps;
  if (frame < t0 - 1 || frame > t1) return null;

  const enter = interpolate(frame, [t0, t0 + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const exit = interpolate(frame, [t1 - 4, t1], [1, 0], clamp);
  const r = ROLE[role];
  const shift = align === "center" ? "-50%" : align === "right" ? "-100%" : "0%";

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        transform: `translateX(${shift}) scale(${1.15 - 0.15 * enter})`,
        transformOrigin: "center",
        opacity: enter * exit,
        filter: `blur(${(1 - enter) * 12 + (1 - exit) * 8}px)`,
        whiteSpace: "nowrap",
        fontFamily: font ?? KINETIC_FONT,
        fontWeight: weight ?? r.weight,
        fontSize: size ?? r.size,
        letterSpacing: r.tracking,
        wordSpacing: "0.12em",
        lineHeight: 0.9,
        color,
        textShadow: shadow ? "0 4px 24px rgba(0,0,0,0.35)" : undefined,
      }}
    >
      {text}
    </div>
  );
};
