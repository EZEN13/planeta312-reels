import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";

// Объёмные цифры (в шрифте helvetiker только латиница и цифры — для «312» хватает)
const font = new FontLoader().parse(fontJson as never);

const Digits: React.FC<{ text: string; color: string; spin: number }> = ({ text, color, spin }) => {
  const geometry = useMemo(() => {
    const g = new TextGeometry(text, {
      font,
      size: 1.15,
      depth: 0.35,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.035,
      bevelSegments: 6,
    });
    g.center();
    return g;
  }, [text]);
  return (
    <mesh geometry={geometry} rotation={[0.12, spin, 0]}>
      <meshStandardMaterial color={color} metalness={0.25} roughness={0.32} emissive={color} emissiveIntensity={0.18} />
    </mesh>
  );
};

// Вставка ~2 с: вылетает из глубины, делает полный оборот и уходит вверх из кадра (правка 14.10.2026)
const ENTER = 0.4;
const SPIN_END = 1.6;
const EXIT_END = 2.1;
export const TEXT3D_SECONDS = EXIT_END;

export const Text3D: React.FC<{ text: string; color: string; width: number; height: number }> = ({
  text,
  color,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const smooth = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const enter = interpolate(t, [0, ENTER], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) });
  const spin = interpolate(t, [0.15, SPIN_END], [0, Math.PI * 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth });
  const exit = interpolate(t, [SPIN_END, EXIT_END], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x * x });
  const z = interpolate(enter, [0, 1], [-14, 0]);
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 3.1], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <directionalLight position={[-4, -2, 3]} intensity={0.8} color={new THREE.Color("#fff3c4")} />
      <group position={[0, exit * 3.2, z]} rotation={[exit * -0.5, 0, 0]}>
        <Digits text={text} color={color} spin={spin} />
      </group>
    </ThreeCanvas>
  );
};
