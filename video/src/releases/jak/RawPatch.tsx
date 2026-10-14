import { interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Подкладка из исходника без графики (жак_исходник.mp4 → public/jak-raw-1080.mp4).
// Исходник совпадает с монтажом кадр в кадр, кроме графики, перебивок и двух монтажных зумов.
// Под карточкой показываем участок исходника — старой плашки не видно даже по краям.
const RAW = staticFile("jak-raw-1080.mp4");

// Монтажные зумы: [время, масштаб] вокруг точки cx — замерено по кадрам, ошибка 3–5 из 255
const ZOOMS: { cx: number; keys: [number, number][] }[] = [
  { cx: 540, keys: [[35.43, 1.0], [35.57, 1.03], [35.7, 1.1], [35.83, 1.18], [35.97, 1.21], [36.23, 1.23], [37.12, 1.23]] },
  { cx: 540, keys: [[40.83, 1.0], [40.97, 1.02], [41.1, 1.09], [41.23, 1.17], [41.37, 1.2], [41.5, 1.21], [42.07, 1.21]] },
  { cx: 552, keys: [[49.43, 1.0], [49.57, 1.02], [49.7, 1.04], [49.83, 1.1], [49.97, 1.14], [50.1, 1.18], [50.23, 1.2], [50.5, 1.22], [52.88, 1.22]] },
];

const zoomAt = (t: number) => {
  for (const z of ZOOMS) {
    const k = z.keys;
    if (t >= k[0][0] && t <= k[k.length - 1][0]) {
      return { s: interpolate(t, k.map((x) => x[0]), k.map((x) => x[1])), cx: z.cx };
    }
  }
  return { s: 1, cx: 540 };
};

const FEATHER = 40;
const MARGIN = 60;

export type PatchWindow = { from: number; to: number; box: { x: number; y: number; w: number; h: number } };

export const RawPatch: React.FC<{ windows: PatchWindow[] }> = ({ windows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const win = windows.find((w) => t >= w.from && t < w.to);
  if (!win) return null;
  const zoom = zoomAt(t);
  const x = win.box.x - MARGIN;
  const y = win.box.y - MARGIN;
  const w = win.box.w + MARGIN * 2;
  const h = win.box.h + MARGIN * 2;
  // Мягкий край: склейка с монтажом незаметна, даже если зум совпал не идеально
  const fade = (dir: string) => `linear-gradient(${dir}, transparent 0, #000 ${FEATHER}px, #000 calc(100% - ${FEATHER}px), transparent 100%)`;
  const mask = `${fade("to right")}, ${fade("to bottom")}`;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: "hidden",
        WebkitMaskImage: mask,
        WebkitMaskComposite: "source-in",
        maskImage: mask,
        maskComposite: "intersect",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -x,
          top: -y,
          width: 1080,
          height: 1920,
          transform: `scale(${zoom.s})`,
          transformOrigin: `${zoom.cx}px 960px`,
        }}
      >
        <OffthreadVideo src={RAW} muted />
      </div>
    </div>
  );
};
