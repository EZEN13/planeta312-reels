"""Траектория кончика указательного пальца (MediaPipe Hands) — для «рисования в воздухе».

Запуск из папки video/ (окружение ~/.venvs/matting):
  ~/.venvs/matting/bin/python tools/fingertip.py public/jak10-1080.mp4 27.8 29.8 out.json [check.png]
Пишет JSON: {"fps", "start", "points": [[x, y] | null на кадр]} в пикселях 1080×1920.
"""

import json
import subprocess
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

W, H = 1080, 1920
MODEL = Path.home() / ".venvs/matting/mp/hand_landmarker.task"


def main(src, t0, t1, out, check=None, fps=30):
    raw = subprocess.check_output(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-ss", str(t0), "-t", str(t1 - t0), "-i", src,
                                   "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
    frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
    opts = mp.tasks.vision.HandLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        min_tracking_confidence=0.3,
    )
    pts = []
    with mp.tasks.vision.HandLandmarker.create_from_options(opts) as lm:
        for i, f in enumerate(frames):
            r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(f)), int(i * 1000 / fps))
            best = None
            for hand in r.hand_landmarks:
                tip = hand[8]  # кончик указательного
                # Пишущая рука — та, у которой кончик выше (вторая обычно опущена)
                if best is None or tip.y < best[1] / H:
                    best = [tip.x * W, tip.y * H]
            pts.append(best)
    json.dump({"fps": fps, "start": t0, "points": pts}, open(out, "w"))
    print(f"кадров {len(pts)}, найдено {sum(p is not None for p in pts)}", file=sys.stderr)

    if check:
        idx = np.linspace(0, len(frames) - 1, 8).astype(int)
        tiles = []
        for i in idx:
            img = cv2.cvtColor(frames[i], cv2.COLOR_RGB2BGR).copy()
            trail = [p for p in pts[: i + 1] if p]
            for a, b in zip(trail, trail[1:]):
                cv2.line(img, tuple(map(int, a)), tuple(map(int, b)), (0, 220, 255), 8)
            if pts[i]:
                cv2.circle(img, tuple(map(int, pts[i])), 16, (0, 0, 255), -1)
            tiles.append(cv2.resize(img, (200, 356)))
        cv2.imwrite(check, np.hstack(tiles))


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], float(a[1]), float(a[2]), a[3], a[4] if len(a) > 4 else None)
