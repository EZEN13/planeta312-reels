import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY_FONT, SHADOW, SIDE, TEXT_FONT, TOP_SAFE } from "../style/theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Появление пружиной и уход за последние 8 кадров из dur
const useInOut = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const exit = interpolate(frame, [dur - 8, dur], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  return { frame, fps, enter, exit };
};

const formatNumber = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const CountUp: React.FC<{ value: number; startFrame: number }> = ({ value, startFrame }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [startFrame, startFrame + 18], [0, value], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return <>{formatNumber(Math.round(v))}</>;
};

const Top: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ position: "absolute", top: TOP_SAFE, left: SIDE, right: SIDE, ...style }}>
    {children}
  </div>
);

const KeyIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M10.7 12.3 20 3M16 7l3 3M14 9l2 2" />
  </svg>
);

const PinIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

// Плашка «Передача ключей»
export const KeyTag: React.FC<{ dur: number }> = ({ dur }) => {
  const { enter, exit } = useInOut(dur);
  return (
    <Top>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 22,
          padding: "22px 34px 22px 26px",
          borderRadius: 999,
          background: COLORS.accent,
          boxShadow: SHADOW,
          opacity: enter * exit,
          transform: `translateX(${(1 - enter) * -80}px)`,
        }}
      >
        <KeyIcon size={54} color={COLORS.white} />
        <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 42, color: COLORS.white }}>
          ПЕРЕДАЧА КЛЮЧЕЙ
        </span>
      </div>
    </Top>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: number;
  unit?: string;
  appearAt: number;
  countAt: number;
}> = ({ label, value, unit, appearAt, countAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const show = spring({ frame: frame - appearAt, fps, config: { damping: 16, stiffness: 180 } });
  return (
    <div
      style={{
        borderLeft: `10px solid ${COLORS.accent}`,
        paddingLeft: 28,
        opacity: show,
        transform: `translateY(${(1 - show) * 24}px)`,
      }}
    >
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: COLORS.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 104, lineHeight: 1.05, color: COLORS.ink }}>
        <CountUp value={value} startFrame={countAt} />
        {unit ? <span style={{ fontSize: 64 }}>{unit}</span> : null}
      </div>
    </div>
  );
};

// Карточка с параметрами квартиры; кадры отсчитываются от начала Sequence
export const FactsCard: React.FC<{
  dur: number;
  areaAt: number;
  areaCountAt: number;
  paymentAt: number;
  paymentCountAt: number;
}> = ({ dur, areaAt, areaCountAt, paymentAt, paymentCountAt }) => {
  const { enter, exit } = useInOut(dur);
  return (
    <Top>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          gap: 30,
          padding: "36px 44px",
          borderRadius: 40,
          background: COLORS.paper,
          boxShadow: SHADOW,
          opacity: enter * exit,
          transform: `scale(${0.9 + 0.1 * enter})`,
          transformOrigin: "top left",
        }}
      >
        <InfoRow label="Евродвушка" value={56} unit={" м²"} appearAt={areaAt} countAt={areaCountAt} />
        <InfoRow label="Платёж в месяц" value={69000} appearAt={paymentAt} countAt={paymentCountAt} />
      </div>
    </Top>
  );
};

// Заголовок раздела: строки в оранжевых плашках, открываются шторкой
export const SectionTitle: React.FC<{ dur: number; lines: string[] }> = ({ dur, lines }) => {
  const { frame, enter, exit } = useInOut(dur);
  return (
    <Top style={{ opacity: exit }}>
      {lines.map((line, i) => {
        const reveal = interpolate(frame, [i * 4, i * 4 + 12], [0, 100], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div key={line} style={{ marginBottom: 14 }}>
            <span
              style={{
                display: "inline-block",
                padding: "10px 28px 16px",
                background: i === 0 ? COLORS.accent : COLORS.ink,
                color: COLORS.white,
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                fontSize: 96,
                lineHeight: 1.05,
                clipPath: `inset(0 ${100 - reveal}% 0 0)`,
                transform: `translateY(${(1 - enter) * 10}px)`,
              }}
            >
              {line}
            </span>
          </div>
        );
      })}
    </Top>
  );
};

// Подпись комнаты с меткой
export const RoomTag: React.FC<{ dur: number; name: string; note: string }> = ({ dur, name, note }) => {
  const { enter, exit } = useInOut(dur);
  return (
    <Top>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 26,
          padding: "22px 40px 22px 22px",
          borderRadius: 999,
          background: COLORS.paper,
          boxShadow: SHADOW,
          opacity: enter * exit,
          transform: `translateY(${(1 - enter) * -50}px)`,
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 999,
            background: COLORS.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PinIcon size={54} color={COLORS.white} />
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 52, color: COLORS.ink }}>{name}</div>
          <div style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 34, color: COLORS.muted }}>{note}</div>
        </div>
      </div>
    </Top>
  );
};

// Планы переделки: стена перечёркивается в момент слова «убрать»
export const RemodelCard: React.FC<{ dur: number; strikeAt: number }> = ({ dur, strikeAt }) => {
  const { frame, fps, enter, exit } = useInOut(dur);
  const show = spring({ frame: frame - strikeAt, fps, config: { damping: 16, stiffness: 180 } });
  const draw = interpolate(frame, [strikeAt + 4, strikeAt + 16], [1, 0], clamp);
  return (
    <Top>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          padding: "30px 40px",
          borderRadius: 40,
          background: COLORS.paper,
          boxShadow: SHADOW,
          opacity: enter * exit,
          transform: `scale(${0.9 + 0.1 * enter})`,
          transformOrigin: "top left",
        }}
      >
        <div
          style={{
            fontFamily: TEXT_FONT,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 2,
            color: COLORS.accent,
          }}
        >
          ПЛАНЫ НА ПЕРЕДЕЛКУ
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            // Строка раскрывается в момент слова, до этого карточка — только заголовок
            maxHeight: show * 110,
            marginTop: show * 18,
            overflow: "hidden",
            opacity: show,
            transform: `translateY(${(1 - show) * 20}px)`,
          }}
        >
          <svg width={110} height={90} viewBox="0 0 110 90">
            <g fill="none" stroke={COLORS.ink} strokeWidth={5}>
              <rect x={5} y={5} width={100} height={80} rx={4} />
              <path d="M5 31h100M5 58h100M38 5v26M72 5v26M22 31v27M56 31v27M90 31v27M38 58v27M72 58v27" />
            </g>
            <path
              d="M10 10 100 80M100 10 10 80"
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={10}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={draw}
            />
          </svg>
          <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 64, color: COLORS.ink }}>
            Убрать стену
          </span>
        </div>
      </div>
    </Top>
  );
};

// Полоса прогресса ролика
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 10,
        width: `${(frame / durationInFrames) * 100}%`,
        background: COLORS.accent,
      }}
    />
  );
};
