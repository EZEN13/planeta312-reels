import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SHADOW, TEXT_FONT } from "../style/theme";

// Слово из распознавания: время в секундах, phrase — номер фразы на экране
export type Word = { text: string; start: number; end: number; phrase: number };

type Page = { start: number; end: number; words: Word[] };

const toPages = (words: Word[], endSec: number): Page[] => {
  const pages: Page[] = [];
  for (const w of words) {
    const last = pages[pages.length - 1];
    if (last && last.words[0].phrase === w.phrase) {
      last.words.push(w);
    } else {
      pages.push({ start: w.start, end: endSec, words: [w] });
    }
  }
  pages.forEach((p, i) => {
    if (pages[i + 1]) p.end = pages[i + 1].start;
  });
  return pages;
};

const CaptionPage: React.FC<{ page: Page; bottom: number }> = ({ page, bottom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = page.start + frame / fps;
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 10 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom }}>
      <div
        style={{
          maxWidth: 940,
          padding: "18px 26px",
          borderRadius: 30,
          background: COLORS.white,
          boxShadow: SHADOW,
          transform: `scale(${0.85 + 0.15 * pop}) translateY(${(1 - pop) * 20}px)`,
          opacity: Math.min(1, pop * 1.5),
          fontFamily: TEXT_FONT,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.25,
          color: COLORS.ink,
          textAlign: "center",
        }}
      >
        {page.words.map((w, i) => {
          const next = page.words[i + 1];
          const active = t >= w.start && t < (next ? next.start : page.end);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 6px",
                padding: "0 12px",
                borderRadius: 14,
                background: active ? COLORS.accent : "transparent",
                color: active ? COLORS.white : COLORS.ink,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ words: Word[]; endSec: number; bottom: number }> = ({
  words,
  endSec,
  bottom,
}) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {toPages(words, endSec).map((p) => {
        const from = Math.round(p.start * fps);
        const to = Math.round(p.end * fps);
        return (
          <Sequence key={from} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
            <CaptionPage page={p} bottom={bottom} />
          </Sequence>
        );
      })}
    </>
  );
};
