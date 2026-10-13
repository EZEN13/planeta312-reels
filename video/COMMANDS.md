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

src/index.ts и конфиги — из шаблона, не менять.
