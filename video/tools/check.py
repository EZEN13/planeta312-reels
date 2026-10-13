"""Проверка выпуска перед сборкой (уроки 10–12). Ошибка — выход с кодом 1.

Запуск из папки video/:
  python3 tools/check.py mutabar 30.4 25
Сверяет SHA-256 исходника с words-timing.json, раскадровку, звуковой план и файлы звуков.
Печатает таблицу событий: слово, номер, время, кадр.
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def file_duration(path: Path) -> float:
    return float(subprocess.check_output([
        "/opt/homebrew/bin/ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path),
    ]))


def main(release: str, total_sec: float, fps: int):
    pub = Path("public/releases") / release
    src = Path("src/releases") / release
    timing = json.loads((pub / "words-timing.json").read_text())
    board = json.loads((src / "storyboard.json").read_text())
    sound = json.loads((src / "sound-plan.json").read_text())
    errors = []

    audio = Path("public") / timing["audio"]["file"]
    actual = sha256(audio)
    if actual != timing["audio"]["sha256"]:
        print(f"СТОП: SHA-256 исходника {actual[:12]}… не совпадает с words-timing.json — разметку не использовать")
        sys.exit(1)
    for name, doc in (("storyboard.json", board), ("sound-plan.json", sound)):
        if doc["audio"]["sha256"] != actual:
            errors.append(f"{name}: SHA-256 не совпадает с исходником")

    ids = [w["id"] for w in timing["words"]]
    by_id = {w["id"]: w for w in timing["words"]}
    order = {i: k for k, i in enumerate(ids)}

    # Сцены: каждое слово ровно в одной сцене, по порядку
    covered = []
    for s in board["scenes"]:
        a, b = order.get(s["from"]), order.get(s["to"])
        if a is None or b is None:
            errors.append(f"{s['id']}: нет слова {s['from']} или {s['to']}")
            continue
        covered += ids[a:b + 1]
        for e in s["events"]:
            if e["at"] not in by_id:
                errors.append(f"{s['id']}: событие на несуществующем слове {e['at']}")
            elif not a <= order[e["at"]] <= b:
                errors.append(f"{s['id']}: событие {e['at']} вне границ сцены")
    if covered != ids:
        errors.append("сцены покрывают слова с дырами или наложениями")

    # Звуки
    rows = []
    seen = set()
    for e in sound["events"]:
        if e["id"] in seen:
            errors.append(f"{e['id']}: повторяется")
        seen.add(e["id"])
        if e["at"] not in by_id:
            errors.append(f"{e['id']}: нет слова {e['at']}")
            continue
        if not e.get("file"):
            errors.append(f"{e['id']}: файл не выбран")
            continue
        path = Path("public/sfx") / e["file"]
        if not path.exists():
            errors.append(f"{e['id']}: нет файла {path}")
            continue
        start = by_id[e["at"]]["start"] + e["lead"]
        peak = start + e.get("peakSec", 0)
        if start >= total_sec:
            errors.append(f"{e['id']}: звук начинается после конца ролика")
        dur = file_duration(path)
        rows.append((e["id"], e["at"], by_id[e["at"]]["text"], by_id[e["at"]]["start"], e["lead"],
                     round(max(0, start) * fps), round(peak * fps), min(dur, total_sec - max(0, start))))

    print(f"SHA-256 исходника совпадает: {actual[:12]}…")
    print(f"{'событие':14s} {'слово':6s} {'текст':12s} {'время':>6s} {'lead':>6s} {'старт':>6s} {'пик':>5s} {'длина':>6s}")
    for r in rows:
        print(f"{r[0]:14s} {r[1]:6s} {r[2]:12s} {r[3]:6.2f} {r[4]:+6.2f} {r[5]:6d} {r[6]:5d} {r[7]:6.2f}")
    print("Ошибки:", *(errors or ["нет"]), sep="\n  ")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], float(a[1]), int(a[2]))
