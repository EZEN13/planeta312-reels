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

Остальные файлы (src/Root.tsx, src/index.ts, конфиги) — из шаблона, не менять.
