import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, LABEL_FONT, NUM_FONT } from "../jak/theme";

// Значки локаций: чёрные капсулы, белые линии, жёлтые акценты, объёмная тень. Рисованные — без лицензий
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.33, 0, 0.15, 1);
const DEPTH = "0 8px 0 #000, 0 24px 44px rgba(0,0,0,0.42)";

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, frame, fps };
};

const stroke = { fill: "none", stroke: C.white, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const acc = { ...stroke, stroke: C.yellow };

// Иконки 24×24, рисуются линией (draw 0..1)
type IconName = "plan" | "city" | "train" | "bus" | "school" | "kid" | "shop" | "park" | "walk";
const Icon: React.FC<{ name: IconName; size: number; draw: number }> = ({ name, size, draw }) => {
  const d = (p: string, st = stroke) => <path d={p} {...st} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />;
  const body: Record<IconName, React.ReactNode> = {
    plan: (
      <>
        {d("M3 4h18v16H3z")}
        {d("M12 4v9M12 16v4M3 12h6", acc)}
      </>
    ),
    city: (
      <>
        {d("M2 21h20")}
        {d("M4 21V10h5v11M9 21V5h6v16M15 21v-8h5v8")}
        {d("M11 8h2M11 11h2M11 14h2", acc)}
      </>
    ),
    train: (
      <>
        {d("M6 3h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2z")}
        {d("M4 10h16", acc)}
        {d("M8 14.5h.01M16 14.5h.01M8 18l-2 3M16 18l2 3")}
      </>
    ),
    bus: (
      <>
        {d("M5 3h14a1 1 0 0 1 1 1v13H4V4a1 1 0 0 1 1-1z")}
        {d("M4 11h16", acc)}
        {d("M7 17v3M17 17v3M7.5 14h.01M16.5 14h.01")}
      </>
    ),
    school: (
      <>
        {d("M3 21h18M5 21V10l7-5 7 5v11")}
        {d("M10 21v-5h4v5", acc)}
        {d("M12 5V2h3")}
      </>
    ),
    kid: (
      <>
        {d("M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", acc)}
        {d("M12 8v7M7 11l5-2 5 2M9 21l3-6 3 6")}
      </>
    ),
    shop: (
      <>
        {d("M3 4h2l2.5 11h11L21 7H6.5")}
        {d("M9 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", acc)}
      </>
    ),
    park: (
      <>
        {d("M12 2l5 7h-3l4 6H6l4-6H7z")}
        {d("M12 15v6M8 21h8", acc)}
      </>
    ),
    walk: (
      <>
        {d("M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", acc)}
        {d("M9 22l3-7 3 3v4M12 15l1-6 3 3h3M13 9l-4 2-1 4")}
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {body[name]}
    </svg>
  );
};

const life = (t: number, from: number, to: number) => {
  const enter = interpolate(t, [from, from + 0.5], [0, 1], { ...clamp, easing: smooth });
  const out = interpolate(t, [to - 0.35, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return { enter, out, k: enter * out };
};

// Капсула «значок + подпись» сверху
export const LocChip: React.FC<{ from: number; to: number; icon: IconName; text: string; sub?: string; top?: number }> = ({
  from,
  to,
  icon,
  text,
  sub,
  top = 210,
}) => {
  const { t } = useT();
  if (t < from || t >= to) return null;
  const { enter, k } = life(t, from, to);
  const draw = interpolate(t, [from + 0.15, from + 0.85], [0, 1], { ...clamp, easing: smooth });
  return (
    <div style={{ position: "absolute", top, left: 0, width: 1080, display: "flex", justifyContent: "center", opacity: k }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "18px 40px 18px 18px",
          borderRadius: 999,
          background: C.plate,
          boxShadow: DEPTH,
          transform: `translateY(${(1 - k) * -40}px) scale(${0.88 + 0.12 * enter})`,
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            border: `3px solid ${C.yellow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={64} draw={draw} />
        </div>
        <div>
          <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.05 }}>{text}</div>
          {sub ? <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 34, color: C.yellow, lineHeight: 1.2 }}>{sub}</div> : null}
        </div>
      </div>
    </div>
  );
};

// «15 минут общественным транспортом»: кольцо-таймер досчитывает до 15 и держится
export const TimerChip: React.FC<{ from: number; countAt: number; countEnd: number; to: number; minutes: number }> = ({
  from,
  countAt,
  countEnd,
  to,
  minutes,
}) => {
  const { t } = useT();
  if (t < from || t >= to) return null;
  const { enter, k } = life(t, from, to);
  const p = interpolate(t, [countAt, countEnd], [0, 1], { ...clamp, easing: smooth });
  const r = 46;
  const L = 2 * Math.PI * r;
  const draw = interpolate(t, [from + 0.15, from + 0.85], [0, 1], { ...clamp, easing: smooth });
  return (
    <div style={{ position: "absolute", top: 200, left: 0, width: 1080, display: "flex", justifyContent: "center", opacity: k }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "16px 40px 16px 16px",
          borderRadius: 999,
          background: C.plate,
          boxShadow: DEPTH,
          transform: `translateY(${(1 - k) * -40}px) scale(${0.88 + 0.12 * enter})`,
        }}
      >
        <div style={{ position: "relative", width: 112, height: 112 }}>
          <svg width={112} height={112} viewBox="0 0 112 112" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={9} />
            <circle cx={56} cy={56} r={r} fill="none" stroke={C.yellow} strokeWidth={9} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: NUM_FONT,
              fontWeight: 900,
              fontSize: 46,
              color: C.white,
            }}
          >
            {Math.round(p * minutes)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.05 }}>минут</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 32, color: C.yellow }}>
            <Icon name="bus" size={40} draw={draw} />
            на транспорте
          </div>
        </div>
      </div>
    </div>
  );
};

// «Всё в пешей доступности»: школа, садик, магазин, парк — по очереди, под ними «пешком»
export const WalkRow: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const { t, frame, fps } = useT();
  if (t < from || t >= to) return null;
  const { k } = life(t, from, to);
  const items: { icon: IconName; label: string }[] = [
    { icon: "school", label: "школа" },
    { icon: "kid", label: "садик" },
    { icon: "shop", label: "магазин" },
    { icon: "park", label: "парк" },
  ];
  const caption = interpolate(t, [from + 0.75, from + 1.2], [0, 1], { ...clamp, easing: smooth });
  return (
    <div style={{ position: "absolute", top: 180, left: 0, width: 1080, opacity: k }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 26 }}>
        {items.map((it, i) => {
          const at = from + i * 0.16;
          const s = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 200, stiffness: 110 } });
          const draw = interpolate(t, [at + 0.1, at + 0.7], [0, 1], { ...clamp, easing: smooth });
          return (
            <div key={it.icon} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: s, transform: `translateY(${(1 - s) * -30}px) scale(${0.8 + 0.2 * s})` }}>
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  background: C.plate,
                  border: `3px solid ${C.yellow}`,
                  boxShadow: DEPTH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={it.icon} size={84} draw={draw} />
              </div>
              <div style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 34, color: C.white, textShadow: "0 4px 0 #000, 0 10px 24px rgba(0,0,0,0.5)" }}>{it.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 22, opacity: caption, transform: `translateY(${(1 - caption) * 16}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px 12px 20px", borderRadius: 999, background: C.yellow, boxShadow: DEPTH }}>
          <svg width={44} height={44} viewBox="0 0 24 24">
            <path d="M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM9 22l3-7 3 3v4M12 15l1-6 3 3h3M13 9l-4 2-1 4" fill="none" stroke={C.plate} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 38, color: C.plate }}>в пешей доступности</span>
        </div>
      </div>
    </div>
  );
};

// «Всё в пешей доступности» — монетка: школа → (переворот 180°) садик → магазин → парк, с объёмным ребром
const COIN_FACES: { icon: IconName; label: string }[] = [
  { icon: "school", label: "школа" },
  { icon: "kid", label: "садик" },
  { icon: "shop", label: "магазин" },
  { icon: "park", label: "парк" },
];
const FLIP_SEC = 0.42;
const COIN = 225; // в 1,5 раза больше значка из ряда (150)
const EDGE = 14; // толщина ребра, px

export const CoinFlip: React.FC<{ from: number; to: number; flips: number[] }> = ({ from, to, flips }) => {
  const { t, frame, fps } = useT();
  if (t < from || t >= to) return null;
  const enter = spring({ frame: frame - Math.round(from * fps), fps, config: { damping: 200, stiffness: 90 } });
  const out = interpolate(t, [to - 0.4, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  // Какой переворот идёт и его доля
  let face = 0;
  let angle = 0;
  let land = 1;
  flips.forEach((f, i) => {
    if (t >= f + FLIP_SEC) face = i + 1;
    else if (t >= f) {
      const p = interpolate(t - f, [0, FLIP_SEC], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      // Первая половина — старая сторона уходит, вторая — новая приходит
      face = p < 0.5 ? i : i + 1;
      angle = p < 0.5 ? p * 180 : (p - 1) * 180;
    }
    // Лёгкий «прыжок» монетки во время переворота и мягкая посадка
    land *= 1 + 0.12 * Math.sin(Math.PI * interpolate(t - f, [0, FLIP_SEC], [0, 1], clamp));
  });
  const cur = COIN_FACES[Math.min(face, COIN_FACES.length - 1)];
  const draw = face === 0 ? interpolate(t, [from + 0.15, from + 0.75], [0, 1], { ...clamp, easing: smooth }) : 1;
  const lift = (land - 1) * -260;
  const caption = interpolate(t, [from + 0.5, from + 0.95], [0, 1], { ...clamp, easing: smooth });
  const layers = Array.from({ length: 7 }, (_, i) => -(i + 1) * (EDGE / 7));
  return (
    <div style={{ position: "absolute", top: 160, left: 0, width: 1080, display: "flex", flexDirection: "column", alignItems: "center", opacity: out }}>
      <div style={{ perspective: 900, transform: `translateY(${lift + (1 - enter) * -50}px) scale(${(0.6 + 0.4 * enter) * land})` }}>
        <div style={{ position: "relative", width: COIN, height: COIN, transformStyle: "preserve-3d", transform: `rotateY(${angle}deg)` }}>
          {/* Ребро монетки — стопка жёлтых дисков за лицевой стороной */}
          {layers.map((z, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 999, background: i === layers.length - 1 ? "#000" : "#C9B000", transform: `translateZ(${z}px)` }} />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: C.plate,
              border: `6px solid ${C.yellow}`,
              boxShadow: "inset 0 0 0 10px rgba(245,220,5,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backfaceVisibility: "hidden",
            }}
          >
            <Icon name={cur.icon} size={128} draw={draw} />
          </div>
        </div>
      </div>
      {/* Тень на «полу» под монеткой: сжимается, когда монетка подпрыгивает */}
      <div style={{ width: COIN * 0.7, height: 22, marginTop: 18, borderRadius: 999, background: "rgba(0,0,0,0.45)", filter: "blur(10px)", transform: `scaleX(${(1 - (land - 1) * 2) * enter})` }} />
      <div
        key={cur.label}
        style={{
          marginTop: 6,
          fontFamily: LABEL_FONT,
          fontWeight: 800,
          fontSize: 50,
          color: C.white,
          textShadow: "0 5px 0 #000, 0 12px 26px rgba(0,0,0,0.5)",
          opacity: enter * (Math.abs(angle) > 60 ? 0.3 : 1),
        }}
      >
        {cur.label}
      </div>
      <div style={{ marginTop: 18, opacity: caption, transform: `translateY(${(1 - caption) * 16}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 30px 12px 20px", borderRadius: 999, background: C.yellow, boxShadow: DEPTH }}>
          <svg width={44} height={44} viewBox="0 0 24 24">
            <path d="M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM9 22l3-7 3 3v4M12 15l1-6 3 3h3M13 9l-4 2-1 4" fill="none" stroke={C.plate} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: LABEL_FONT, fontWeight: 800, fontSize: 38, color: C.plate }}>в пешей доступности</span>
        </div>
      </div>
    </div>
  );
};
