"""По маске из tools/matte.py находит макушку в каждом кадре — куда ставить слова за головой.

Запуск из папки video/:
  python3 tools/heads.py public/mattes/mutabar.webm 0 30.4 [шаг_с]
Печатает таблицу: время, верх головы (y) и центр головы (x) в пикселях кадра 1080×1920.
Если людей в кадре несколько — берёт самого высокого.
"""

import subprocess
import sys

W, H = 1080, 1920
SCALE = 4  # анализ в 270×480
w, h = W // SCALE, H // SCALE


def main(matte: str, start: float, duration: float, step: float = 0.5):
    t = start
    while t < start + duration:
        raw = subprocess.check_output([
            "/opt/homebrew/bin/ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-ss", str(t), "-i", matte,
            "-frames:v", "1", "-vf", f"alphaextract,scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-",
        ])
        top = None
        for y in range(h):
            row = raw[y * w:(y + 1) * w]
            xs = [x for x in range(w) if row[x] > 128]
            if len(xs) >= 3:
                top = (y * SCALE, sum(xs) / len(xs) * SCALE)
                # Центр головы — по строке на 30 px ниже макушки
                below = raw[(y + 8) * w:(y + 9) * w]
                xb = [x for x in range(w) if below[x] > 128]
                if xb:
                    top = (y * SCALE, sum(xb) / len(xb) * SCALE)
                break
        print(f"{t:5.1f}  " + (f"top={top[0]:4d}  x={top[1]:4.0f}" if top else "нет человека"))
        t = round(t + step, 3)


if __name__ == "__main__":
    args = sys.argv[1:]
    main(args[0], float(args[1]), float(args[2]), float(args[3]) if len(args) > 3 else 0.5)
