# Команды проекта video

Все команды запускаются из папки video/. Нужны Node.js и npm.

## Предпросмотр
npm run dev
Запускает Remotion Studio — предпросмотр в браузере, http://localhost:3000.

## Проверка проекта
npm run lint
Линтер ESLint по src и проверка типов TypeScript (eslint src && tsc).

## Сборка тестового MP4
npx remotion render Check1 out/check-1.mp4
Собирает композицию Check1 (1080×1920, 30 fps, 150 кадров = 5 с) в out/check-1.mp4. Папка out/ в Git не попадает. На Mac с 8 ГБ при нехватке памяти добавить --concurrency=2.

## Распознавание речи
ffmpeg -t 32 -i "public/ИСХОДНИК.mp4" -ar 16000 -ac 1 -c:a pcm_s16le work/clip.wav
whisper-cli -m ~/whisper-models/ggml-large-v3-turbo-q5_0.bin -f work/clip.wav -l ru -oj -of work/words -ml 1 -sow -t 4
Звук первых 32 с → work/words.json, по слову на строку с таймингом. -t 32 убрать, чтобы взять весь исходник.

## Сборка ролика Mutabar
npx remotion render Mutabar out/mutabar-30s.mp4 --concurrency=2
Ролики регистрируются в src/Root.tsx, сами ролики — в src/reels/, общие субтитры и графика — в src/components/, стиль — в src/style/theme.ts.

## Маска спикера (текст за человеком)
~/.venvs/matting/bin/python tools/matte.py "public/ИСХОДНИК.mp4" 20.0 4.4 public/mattes/kitchen.webm
Вырезает человека из куска исходника (начало и длина в секундах) в WebM VP9 с прозрачным фоном. Нейросеть RobustVideoMatting, окружение и веса в ~/.venvs/matting (PyTorch, ускорение MPS). На M2 — около 11 с работы на 1 с видео.
В Remotion: <OffthreadVideo src={...} transparent muted /> внутри <AbsoluteFill>, поверх исходника с тем же началом (trimBefore). Пример — src/reels/MaskTest.tsx.

## Где голова (для слов за спикером)
python3 tools/heads.py public/mattes/mutabar.webm 0 30.4 0.5
Таблица: время, макушка (y) и центр головы (x). Ключевое слово ставить с верхом ≈ макушка − 0,3 размера шрифта.

## Сборка Mutabar v2 (по STYLE.md)
npx remotion render Mutabar2 out/mutabar-v2.mp4 --concurrency=2
Около 10 мин на M2: кадры маски извлекаются с прозрачностью.

## Выпуск по урокам 10–12 (папки releases/<выпуск>)
Порядок: разметка слов → раскадровка → звуковой план → проверка → сборка.
1. Разметка: whisper-cli ... -ojf -ml 1 -sow -of work/words-full, затем
   python3 tools/words.py work/words-full.json "public/ИСХОДНИК.mp4" 0 30.4 public/releases/mutabar
   Пишет words-timing.json (номера слов n001…, SHA-256 и длительность исходника), печатает сомнительные слова.
   Написание на экране и ручные правки времени — в public/releases/mutabar/pronounce.json.
2. Раскадровка: public/releases/mutabar/storyboard.md (для человека) и src/releases/mutabar/storyboard.json (для сборки).
3. Звуковой план: public/releases/mutabar/sound-plan.md и src/releases/mutabar/sound-plan.json. Звуки — public/sfx/ (в Git не попадают), источники — SFX-SOURCES.md. Библиотека: ~/Documents/SGX _ SFX.
4. Проверка перед сборкой: python3 tools/check.py mutabar 30.4 25
5. Сборка: npx remotion render Mutabar2 out/mutabar-v3-sound.mp4 --concurrency=2
6. Громкость: ffmpeg -hide_banner -i out/ФАЙЛ.mp4 -vn -af loudnorm=I=-14:TP=-1:LRA=7:print_format=json -f null -

## Выпуск jak
ffmpeg -i "public/жак эксперт_1.mp4" -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 14 -preset slow -c:a copy public/jak-1080.mp4
Рабочая копия 1080×1920 — сборка из 4K в разы медленнее. Разметка, проверка и звуки — как у mutabar (releases/jak).
python3 tools/overlays.py public/jak-1080.mp4 0.1 — где и когда в исходнике вшитый жёлтый/красный текст.
npx remotion render Jak out/jak-v1.mp4 --concurrency=2
3D (Three.js) в рендере работает через ANGLE — включено в remotion.config.ts.

## Трекинг плоскости (рисунок «прилипает» к стене/полу)
~/.venvs/matting/bin/python tools/track_plane.py "public/ИСХОДНИК.mp4" 28.6 35.2 30.4 "340,440 1080,40 1080,1560 345,1180" src/releases/mut2/plane-wall.json work/check.png
Время — в исходнике; многоугольник плоскости — на опорном кадре. Для далёких объектов за окном — флаг --affine (не цепляется за раму).
В Remotion: PlaneLayer из src/releases/mut2/Plane.tsx (гомография → CSS matrix3d). Подписи — не в PlaneLayer, а закреплены на экране.

## Сборка mut2
npx remotion render Mut2 out/mut2-v1.mp4 --concurrency=2

## Проба маски
npx remotion render MaskTest out/mask-test.mp4 --concurrency=2

src/index.ts и конфиги — из шаблона, не менять.
