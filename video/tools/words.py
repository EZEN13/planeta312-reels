"""Словная разметка выпуска: words-timing.json из распознавания whisper.cpp (урок 10).

Вход — JSON whisper-cli с -ojf -ml 1 -sow (по слову на сегмент, с вероятностями токенов).
Запуск из папки video/:
  python3 tools/words.py work/words-full.json "public/исходник.mp4" 0 30.4 public/releases/mutabar
Читает pronounce.json из папки выпуска, пишет туда words-timing.json и печатает проверки.
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

LONG_WORD_SEC = 1.5
LOW_P = 0.5  # средняя вероятность токенов слова ниже этой — слово сомнительное


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def duration(path: Path) -> float:
    out = subprocess.check_output([
        "/opt/homebrew/bin/ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(path),
    ])
    return round(float(out), 3)


def main(whisper_json: str, source: str, clip_start: float, clip_end: float, release: str):
    rel = Path(release)
    src = Path(source)
    pron = json.loads((rel / "pronounce.json").read_text())

    raw = []
    for seg in json.loads(Path(whisper_json).read_text())["transcription"]:
        text = seg["text"].strip()
        if not text:
            continue
        ps = [t["p"] for t in seg.get("tokens", []) if not t["text"].startswith("[")]
        raw.append({
            "text": text,
            "start": round(clip_start + seg["offsets"]["from"] / 1000, 3),
            "end": round(clip_start + seg["offsets"]["to"] / 1000, 3),
            "p": round(sum(ps) / len(ps), 3) if ps else None,
        })
    # Только слова внутри отрезка выпуска
    raw = [w for w in raw if w["end"] <= clip_end + 0.05]

    # Склейка слов, которые whisper разбил («евро» + «двушку»)
    words, i = [], 0
    while i < len(raw):
        for parts in pron["merge"]:
            n = len(parts)
            if [w["text"] for w in raw[i:i + n]] == parts:
                ps = [w["p"] for w in raw[i:i + n] if w["p"] is not None]
                words.append({
                    "text": "".join(parts), "start": raw[i]["start"], "end": raw[i + n - 1]["end"],
                    "p": round(min(ps), 3) if ps else None,
                })
                i += n
                break
        else:
            words.append(raw[i])
            i += 1

    out = []
    for k, w in enumerate(words, 1):
        item = {"id": f"n{k:03d}", "text": w["text"], "start": w["start"], "end": w["end"], "p": w["p"]}
        if w["text"] in pron["show"]:
            item["show"] = pron["show"][w["text"]]
        # Точечная правка времени — только у названных слов, остальные не трогаем
        if item["id"] in pron.get("retime", {}):
            item["start"], item["end"] = pron["retime"][item["id"]]
            item["fixed"] = True
        out.append(item)

    doc = {
        "audio": {
            "file": str(src.relative_to("public")) if src.parts[0] == "public" else str(src),
            "sha256": sha256(src),
            "durationSec": duration(src),
            "clip": {"start": clip_start, "end": clip_end},
        },
        "route": "whisper.cpp large-v3-turbo-q5_0, распознавание (голос живой, сценария нет)",
        "words": out,
    }
    (rel / "words-timing.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

    # Проверки
    errors, doubtful = [], []
    for a, b in zip(out, out[1:]):
        if b["start"] < a["end"] - 0.01:
            errors.append(f"{a['id']}–{b['id']}: слова накладываются")
    for w in out:
        if w["start"] >= w["end"]:
            errors.append(f"{w['id']}: начало не меньше конца")
        if w["end"] > clip_end + 0.05:
            errors.append(f"{w['id']}: за пределами отрезка")
        if w["end"] - w["start"] > LONG_WORD_SEC:
            doubtful.append(f"{w['id']} «{w['text']}» {w['start']}–{w['end']}: длиннее {LONG_WORD_SEC} с")
        if w["p"] is not None and w["p"] < LOW_P:
            doubtful.append(f"{w['id']} «{w['text']}» {w['start']}–{w['end']}: уверенность {w['p']}")
    print(f"{len(out)} слов, {out[0]['id']}–{out[-1]['id']}, sha256 {doc['audio']['sha256'][:12]}…")
    print("Ошибки:", *(errors or ["нет"]), sep="\n  ")
    print("Сомнительные:", *(doubtful or ["нет"]), sep="\n  ")


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], a[1], float(a[2]), float(a[3]), a[4])
