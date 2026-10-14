"""Слежение за точкой в кадре — чтобы рисунок «прилипал» к стене при движении камеры.

Ищет участок кадра (шаблон) в каждом следующем кадре рядом с прошлым положением.
Запуск из папки video/ (нужен numpy — окружение ~/.venvs/matting):
  ~/.venvs/matting/bin/python tools/track.py "public/исходник.mp4" 28.6 35.2 880 250 120 90 > track.json
  (время — в исходнике; x y w h — участок в кадре 1080×1920 в первом кадре)
Пишет JSON: {"fps":…, "start":…, "points":[[dx, dy], …]} — сдвиг относительно первого кадра.
"""

import json
import subprocess
import sys

import numpy as np

S = 4  # поиск в уменьшенном кадре 270×480, потом уточнение не нужно — рисунку хватает ±4 px
W, H = 1080 // S, 1920 // S


def frames(src, t0, t1):
    p = subprocess.Popen(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-ss", str(t0), "-t", str(t1 - t0), "-i", src,
                          "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            return
        yield np.frombuffer(b, np.uint8).astype(np.float32).reshape(H, W)


def main(src, t0, t1, x, y, w, h, fps=25):
    x, y, w, h = x // S, y // S, w // S, h // S
    it = frames(src, t0, t1)
    first = next(it)
    tpl = first[y:y + h, x:x + w]
    tpl = (tpl - tpl.mean()) / (tpl.std() + 1e-6)
    cx, cy = x, y
    pts = [[0, 0]]
    R = 12  # радиус поиска между соседними кадрами (в уменьшенных пикселях)
    for f in it:
        best = (-9, cx, cy)
        for yy in range(max(0, cy - R), min(H - h, cy + R) + 1):
            for xx in range(max(0, cx - R), min(W - w, cx + R) + 1):
                p = f[yy:yy + h, xx:xx + w]
                c = float(((p - p.mean()) / (p.std() + 1e-6) * tpl).mean())
                if c > best[0]:
                    best = (c, xx, yy)
        _, cx, cy = best
        pts.append([(cx - x) * S, (cy - y) * S])
    print(json.dumps({"fps": fps, "start": t0, "points": pts}))


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], float(a[1]), float(a[2]), *map(int, a[3:7]))
