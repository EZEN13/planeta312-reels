import { AbsoluteFill, Composition, interpolate, useCurrentFrame } from "remotion";

const WIDTH = 1080;
const HEIGHT = 1920;

export const MyComposition = () => {
  return (
    <Composition
      id="Check1"
      component={MyComponent}
      durationInFrames={150}
      fps={30}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

export const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#F7F5F0" }}>
      {/* Нижняя треть кадра; низ текста не ниже 12 % высоты от нижнего края */}
      <div
        style={{
          position: "absolute",
          top: HEIGHT * (2 / 3),
          bottom: HEIGHT * 0.12,
          left: 80,
          right: 80,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity,
            width: "100%",
            fontFamily: "'DejaVu Sans', sans-serif",
            fontWeight: 700,
            fontSize: 88,
            lineHeight: 1.15,
            color: "#141414",
            overflowWrap: "break-word",
          }}
        >
          3 правила, чтобы агент не сломал проект
        </div>
      </div>
    </AbsoluteFill>
  );
};
