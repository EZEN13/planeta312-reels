"""Вырезает человека из куска видео в WebM с прозрачным фоном (VP9 + альфа).

Нейросеть RobustVideoMatting (mobilenetv3), окружение ~/.venvs/matting.
Запуск из папки video/:
  ~/.venvs/matting/bin/python tools/matte.py "public/исходник.mp4" 20.0 4.4 public/mattes/kitchen.webm
"""

import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch

RVM = Path.home() / ".venvs/matting/rvm"
sys.path.insert(0, str(RVM / "repo"))
from model import MattingNetwork  # noqa: E402

FFMPEG = "/opt/homebrew/bin/ffmpeg"
FFPROBE = "/opt/homebrew/bin/ffprobe"


def probe(src: str):
    out = subprocess.check_output([
        FFPROBE, "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", src,
    ]).decode().strip().split(",")
    return int(out[0]), int(out[1]), out[2]


def main(src: str, start: float, duration: float, dst: str, ratio: float = 0.25):
    w, h, fps = probe(src)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = MattingNetwork("mobilenetv3").eval().to(device)
    model.load_state_dict(torch.load(RVM / "rvm_mobilenetv3.pth", map_location=device))

    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    reader = subprocess.Popen(
        [FFMPEG, "-v", "error", "-ss", str(start), "-t", str(duration), "-i", src,
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    writer = subprocess.Popen(
        [FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
         "-s", f"{w}x{h}", "-r", fps, "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24",
         "-auto-alt-ref", "0", dst],
        stdin=subprocess.PIPE,
    )

    rec = [None] * 4
    frames = 0
    t0 = time.time()
    with torch.no_grad():
        while True:
            buf = reader.stdout.read(w * h * 3)
            if len(buf) < w * h * 3:
                break
            rgb = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
            x = torch.from_numpy(rgb).to(device).permute(2, 0, 1)[None].float() / 255
            _, pha, *rec = model(x, *rec, downsample_ratio=ratio)
            alpha = (pha[0, 0].clamp(0, 1) * 255).byte().cpu().numpy()
            # Цвет берём из исходного кадра: слой ляжет поверх того же видео
            writer.stdin.write(np.dstack([rgb, alpha]).tobytes())
            frames += 1
    writer.stdin.close()
    writer.wait()
    reader.wait()
    print(f"{frames} кадров за {time.time() - t0:.1f} с ({device}) → {dst}")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4])
