# SETUP — перенос проекта на новый Mac

Этот файл читает **Claude Code** нового человека. Задача: поднять проект так, чтобы он работал как у автора, и проверить это.

Человеку достаточно открыть папку проекта в Claude Code и написать:
> Прочитай SETUP.md и настрой проект по нему. Перед каждой установкой и скачиванием спрашивай меня.

---

## Что это за проект
Вертикальные ролики 1080×1920 для «Планеты-312» (недвижимость, ипотека). Монтаж и моушен-графика в **Remotion 4.0.535** (папка `video/`) поверх готовых исходников. Основа — пословная разметка речи (whisper.cpp): по ней ставятся субтитры, графика и звуки.

Перед любой работой прочитай: `CLAUDE.md` → `PROGRESS.md` → `STYLE.md` → `video/COMMANDS.md` → `setup/AGENT-NOTES.md`.

## Требования
- Mac на Apple Silicon (проверено на MacBook Air M2 8 ГБ), macOS 15+.
- Около 10 ГБ свободного места: модели whisper ~1,6 ГБ, PyTorch ~1 ГБ, node_modules, исходники.
- Homebrew (ставит сам человек: https://brew.sh). Claude не ставит его за человека и не использует sudo.

## Шаги для Claude

### 1. Осмотр
- Убедись, что открыт корень проекта (здесь лежат `CLAUDE.md`, `SETUP.md`, `video/`).
- `uname -m` должно дать `arm64`. Проверь `brew --version`. Нет Homebrew — попроси человека поставить и остановись.
- Покажи человеку, что будет установлено (раздел «Что ставит скрипт») и сколько это весит. Дождись «да».

### 2. Установка окружения
```bash
bash setup/bootstrap.sh
```
Скрипт можно запускать повторно. Если шаг упал — покажи текст ошибки дословно, одна гипотеза, один фикс, повтор (не меняй всё сразу).

### 3. Права агента
Если `.claude/settings.json` в корне нет — предложи скопировать `setup/claude-settings.example.json` туда (запрет читать `.env`, вопрос перед `git push`, `curl`, `wget`). Режим работы — Manual или acceptEdits, не auto и не bypass.

### 4. Привычки
Сохрани пункты из `setup/AGENT-NOTES.md` в свою память (или договорись с человеком, что этот файл читается в начале каждой сессии).

### 5. Навыки Remotion
Официальные навыки уже лежат в `video/.claude/skills` и `video/.agents/skills`. Если ты их не видишь — запусти в `video/`: `npx remotion skills add`.

### 6. Материалы, которых нет в Git
Git хранит только код и данные выпусков. Остальное человек переносит сам (флешка, облако):

| Что | Куда положить | Примечание |
|---|---|---|
| Исходники роликов (`*.mp4` заказчика) | `video/public/` с **теми же именами** | имена видны в `staticFile("…")` в `video/src` |
| Рабочие копии `*-1080.mp4` | `video/public/` | можно не переносить — пересобираются командой из `video/COMMANDS.md` |
| Маски спикера `video/public/mattes/*.webm` | `video/public/mattes/` | можно пересобрать `tools/matte.py` (долго) |
| Референсы стиля `video/public/refs/` | `video/public/refs/` | только для разбора, в рендер не идут |
| Звуковая библиотека | `~/Documents/SGX _ SFX/` | **«Звуковая библиотека +VIBE» — материал клуба, раздавать нельзя.** Человек скачивает её сам из своего доступа к курсу. Нет доступа — подобрать свободные звуки (например Kenney, CC0) и записать в `video/SFX-SOURCES.md` |
| Звуки выпусков `video/public/sfx/` | — | копируются из библиотеки по `sound-plan.json` (в Git не попадают из-за лицензий) |

Проверь, каких файлов не хватает:
```bash
cd video && grep -rhoE 'staticFile\("[^"]+' src | cut -d'"' -f2 | sort -u | while read f; do [ -e "public/$f" ] || echo "нет: public/$f"; done
```

### 7. Проверка, что всё работает
Из `video/`:
1. `npm run lint` — без ошибок.
2. `npx remotion render Check1 out/check-1.mp4 --concurrency=2` → открыть файл: 1080×1920, 30 fps, 5 с (сверить `ffprobe`).
3. Распознавание на любом исходнике (команда в `video/COMMANDS.md`, раздел «Распознавание речи») — текст должен быть осмысленным.
4. `~/.venvs/matting/bin/python -c "import torch; print(torch.backends.mps.is_available())"` → `True`.
5. Если исходники на месте — `npm run dev`, открыть любой выпуск в Studio (http://localhost:3000).

Отчитайся человеку таблицей: проверка → прошла / упала / не запускалась. «Готово» без открытого MP4 не считается.

## Что ставит скрипт
- Homebrew: `node`, `ffmpeg`, `whisper-cpp` (команда `whisper-cli`), `python@3.11`, `git`.
- `npm ci` в `video/` — версии строго из `package-lock.json`. Remotion бесплатен для одного человека и команд до 3 человек; от 4 — платная лицензия.
- Модели whisper в `~/whisper-models/`: `ggml-large-v3-turbo-q5_0.bin` (~550 МБ, быстрая, русский) и `ggml-large-v3-q5_0.bin` (~1 ГБ, точнее на таджикском/узбекском).
- Python-окружение `~/.venvs/matting` (`setup/requirements-tools.txt`): PyTorch, OpenCV, MediaPipe.
- RobustVideoMatting (код + веса `rvm_mobilenetv3.pth`, GPL-3.0) в `~/.venvs/matting/rvm/`.
- Модель руки MediaPipe `hand_landmarker.task` в `~/.venvs/matting/mp/`.

Ключи API проекту сейчас не нужны: всё работает локально и бесплатно. Если позже подключат ElevenLabs/OpenAI — ключ кладёт сам человек в `.env`, в чат не присылает.

## Карта проекта
```
CLAUDE.md, PROGRESS.md, STYLE.md   правила, состояние, стиль
setup/                              этот перенос
video/
  COMMANDS.md                       все команды с пояснениями
  SFX-SOURCES.md                    откуда звуки и на каких условиях
  src/Root.tsx                      регистрация композиций
  src/components/                   общие субтитры, SfxLayer и т.п.
  src/releases/<выпуск>/            сцены, storyboard.json, sound-plan.json
  public/releases/<выпуск>/         words-timing.json, pronounce.json, storyboard.md, sound-plan.md
  tools/                            words.py, check.py, matte.py, heads.py, track_plane.py, fingertip.py, overlays.py
```
Выпуски: mutabar, mut2, jak, jak10, hus.
