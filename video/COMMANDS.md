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

## Проба маски
npx remotion render MaskTest out/mask-test.mp4 --concurrency=2

src/index.ts и конфиги — из шаблона, не менять.
