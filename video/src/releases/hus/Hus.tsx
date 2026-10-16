import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { InfoPlate, PairPlate } from "../../components/InfoPlate";

// «хус тел»: интервью-отзыв, 151 с. Только плашки по ТЗ (16.10.2026), тайминги — по словам из whisper large-v3.
// Плашки — сверху на шторе над головами (лица на ~700 px), вшитые субтитры внизу не трогаем.
export const HUS_FPS = 30;
export const HUS_SECONDS = 151.0;

export const Hus: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={staticFile("hus-1080.mp4")} />

    {/* 0:08–0:10 — «когда покупали эту квартиру?» */}
    <InfoPlate from={7.85} to={10.4} text="Когда купили квартиру?" />

    {/* 0:15–0:18 — «сколько комнат и сколько стоит?» */}
    <PairPlate from={15.4} to={18.5} label="Сколько комнат" value="и сколько стоит?" valueAt={16.55} />

    {/* 0:22–0:29 — «20 миллионов», «3-комнатная», «общая площадь 84» */}
    <PairPlate from={21.85} to={23.9} label="Цена с подземной парковкой" value="20 000 000 ₽" valueAt={22.5} />
    <PairPlate from={23.95} to={29.4} label="Трёхкомнатная, общая площадь" value="84 м²" valueAt={26.1} />

    {/* 0:40–0:45 — «за сколько обошлась кухня, мебель…» */}
    <InfoPlate from={39.8} to={45.1} text="Сколько стоил ремонт?" />

    {/* 0:48–0:50 — «ремонт и вся техника… где-то 4–5 миллионов» */}
    <PairPlate from={47.85} to={50.8} label="Ремонт и техника" value="4–5 млн ₽" valueAt={48.85} />

    {/* 1:01–1:04 — «сколько вам лет?» — «26» звучит на 1:04,3, плашка держится до 1:05,8 */}
    <PairPlate from={61.25} to={65.8} label="Сколько вам лет?" value="26 лет" valueAt={64.25} />

    {/* 1:17–1:23 — «где находится?», «какая инфраструктура?» */}
    <InfoPlate from={77.7} to={80.35} text="Где находится квартира?" />
    <InfoPlate from={80.4} to={83.4} text="Какая инфраструктура?" />

    {/* 1:28–1:30 — «один километр от МКАДа» */}
    <InfoPlate from={88.75} to={91.3} text="1 км от МКАД" size={100} />
  </AbsoluteFill>
);
