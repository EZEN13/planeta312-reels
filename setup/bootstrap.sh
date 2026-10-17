#!/usr/bin/env bash
# Ставит всё окружение проекта planeta312-reels на чистый Mac (Apple Silicon).
# Запуск из корня проекта: bash setup/bootstrap.sh
# Повторный запуск безопасен: уже установленное пропускается.
# Ничего не удаляет, sudo не использует. Ключей и паролей не просит.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELS="$HOME/whisper-models"
VENV="$HOME/.venvs/matting"

say() { printf '\n== %s\n' "$*"; }

# 1. Homebrew и системные программы
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew не найден. Поставь его сам с https://brew.sh и запусти скрипт снова."
  exit 1
fi
say "Homebrew: node, ffmpeg, whisper-cpp, python@3.11, git"
brew install node ffmpeg whisper-cpp python@3.11 git

# 2. Пакеты Remotion строго по package-lock.json
say "npm ci в video/"
(cd "$ROOT/video" && npm ci --loglevel=error)

# 3. Модели распознавания речи (whisper.cpp)
mkdir -p "$MODELS"
HF="https://huggingface.co/ggerganov/whisper.cpp/resolve/main"
for m in ggml-large-v3-turbo-q5_0.bin ggml-large-v3-q5_0.bin; do
  if [ -s "$MODELS/$m" ]; then echo "есть: $m"; else
    say "Скачиваю $m"
    curl -L --fail -o "$MODELS/$m.part" "$HF/$m" && mv "$MODELS/$m.part" "$MODELS/$m"
  fi
done

# 4. Python-окружение для маски спикера, трекинга и поиска пальца
if [ ! -x "$VENV/bin/python" ]; then
  say "Создаю $VENV"
  "$(brew --prefix python@3.11)/bin/python3.11" -m venv "$VENV"
fi
"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install -r "$ROOT/setup/requirements-tools.txt"

# 5. RobustVideoMatting: код и веса (лицензия GPL-3.0, только для своей работы)
mkdir -p "$VENV/rvm"
[ -d "$VENV/rvm/repo/.git" ] || git clone --depth 1 https://github.com/PeterL1n/RobustVideoMatting.git "$VENV/rvm/repo"
[ -s "$VENV/rvm/rvm_mobilenetv3.pth" ] || curl -L --fail -o "$VENV/rvm/rvm_mobilenetv3.pth" \
  https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3.pth

# 6. MediaPipe: модель руки (для tools/fingertip.py)
mkdir -p "$VENV/mp"
[ -s "$VENV/mp/hand_landmarker.task" ] || curl -L --fail -o "$VENV/mp/hand_landmarker.task" \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

# 7. Проверка
say "Проверка"
node -v; ffmpeg -version | head -1; command -v whisper-cli
"$VENV/bin/python" -c "import torch, cv2, mediapipe; print('torch', torch.__version__, 'mps', torch.backends.mps.is_available()); print('cv2', cv2.__version__)"
(cd "$ROOT/video" && npm run lint)
echo
echo "Готово. Дальше: положить исходники в video/public/ и звуки в ~/Documents/SGX _ SFX (см. SETUP.md)."
