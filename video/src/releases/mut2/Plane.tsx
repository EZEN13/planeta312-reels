import { useCurrentFrame, useVideoConfig } from "remotion";

// Плоскость, найденная tools/track_plane.py: преобразование «опорный кадр → текущий кадр» на каждый кадр.
// Рисунок задаётся в координатах опорного кадра и «прилипает» к стене или полу с перспективой.
export type PlaneTrack = { fps: number; start: number; ref: number; h: number[][] };

type P = [number, number];

const hAt = (track: PlaneTrack, rawSec: number) => {
  const i = Math.max(0, Math.min(track.h.length - 1, Math.round((rawSec - track.start) * track.fps)));
  return track.h[i];
};

// Точка опорного кадра → где она сейчас на экране
export const projectPoint = (track: PlaneTrack, rawSec: number, p: P): P => {
  const h = hAt(track, rawSec);
  const w = h[6] * p[0] + h[7] * p[1] + h[8];
  return [(h[0] * p[0] + h[1] * p[1] + h[2]) / w, (h[3] * p[0] + h[4] * p[1] + h[5]) / w];
};

// offset — сдвиг «монтаж → исходник» для этого куска (трек снят во времени исходника)
export const PlaneLayer: React.FC<{ track: PlaneTrack; offset: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  track,
  offset,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = hAt(track, frame / fps + offset);
  // Гомография 3×3 → CSS matrix3d (столбцами)
  const m = [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, h[8]];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: "0 0",
        transform: `matrix3d(${m.join(",")})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Билинейная точка внутри четырёхугольника стены (u — вдоль, v — сверху вниз) — для рисунков «на стене»
export const onQuad = (q: P[], u: number, v: number): P => {
  const top: P = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u];
  const bot: P = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
  return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
};
