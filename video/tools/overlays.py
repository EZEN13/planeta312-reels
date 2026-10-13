"""Опись вшитой графики: где и когда в видео жёлтый/красный текст и тёмные плашки.

Запуск из папки video/:  python3 tools/overlays.py public/jak-1080.mp4 [шаг_с]
Печатает интервалы и общую рамку (в пикселях 1080×1920) для каждого вида графики.
"""
import subprocess, sys

W, H = 270, 480
S = 1080 / W


def frames(src, step):
    p = subprocess.Popen(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={1/step},scale={W}:{H}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    k = 0
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        yield k * step, b
        k += 1


KINDS = {
    "жёлтый": lambda r, g, b: r > 200 and g > 170 and b < 90,
    "красный": lambda r, g, b: r > 170 and g < 70 and b < 70,
    "плашка": lambda r, g, b: r < 36 and g < 36 and b < 40 and abs(r - b) < 12,
}


def main(src, step=0.1):
    runs = {k: [] for k in KINDS}
    for t, b in frames(src, step):
        for kind, test in KINDS.items():
            xs, ys = [], []
            y0 = int(H * 0.40) if kind == "плашка" else 0
            for y in range(y0, int(H * 0.88)):
                row = y * W * 3
                for x in range(0, W, 2):
                    i = row + x * 3
                    if test(b[i], b[i + 1], b[i + 2]):
                        xs.append(x); ys.append(y)
            hit = len(xs) > (120 if kind == "плашка" else 25)
            r = runs[kind]
            if hit:
                box = [min(xs), min(ys), max(xs), max(ys)]
                if r and t - r[-1][1] <= step * 1.5:
                    r[-1][1] = t
                    r[-1][2] = [min(r[-1][2][0], box[0]), min(r[-1][2][1], box[1]), max(r[-1][2][2], box[2]), max(r[-1][2][3], box[3])]
                else:
                    r.append([t, t, box])
    for kind, r in runs.items():
        print(f"== {kind}")
        for a, e, (x0, y0, x1, y1) in r:
            if e - a >= 0.2:
                print(f"  {a:5.1f}–{e + step:5.1f}  x {x0*S:4.0f}–{x1*S:4.0f}  y {y0*S:4.0f}–{y1*S:4.0f}")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 0.1)
