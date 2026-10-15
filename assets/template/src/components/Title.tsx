import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";

export type TitleSpec = {
  // small tracked caps line with a coral rule, above the brush title
  kicker?: string;
  text?: string;
  // where the block sits on the frame
  at?:
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | "top-left"
    | "top-right"
    | "left"
    | "right"
    | "center"
    | "v-top"
    | "v-low"
    | "v-band";
  size?: number;
  kickerSize?: number;
  // chapter openers get a longer light leak; every title paints in the same way
  style?: "stroke" | "rise";
  // darker backing for titles over pale sky
  scrim?: number;
};

const placement: Record<NonNullable<TitleSpec["at"]>, React.CSSProperties> = {
  "bottom-left": { justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 90px 120px" },
  "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end", padding: "0 120px 90px 0" },
  "bottom-center": { justifyContent: "flex-end", alignItems: "center", padding: "0 0 70px 0" },
  "top-left": { justifyContent: "flex-start", alignItems: "flex-start", padding: "80px 0 0 120px" },
  "top-right": { justifyContent: "flex-start", alignItems: "flex-end", padding: "80px 110px 0 0" },
  left: { justifyContent: "center", alignItems: "flex-start", padding: "0 0 0 140px" },
  right: { justifyContent: "center", alignItems: "flex-end", padding: "0 140px 0 0" },
  center: { justifyContent: "center", alignItems: "center" },
  // 9:16 placements, inside Instagram Reels' safe area (clear of the top bar, caption and side buttons)
  "v-top": { justifyContent: "flex-start", alignItems: "flex-start", padding: "250px 0 0 90px" },
  "v-low": { justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 470px 90px" },
  "v-band": { justifyContent: "flex-start", alignItems: "center", padding: "1240px 0 0 0" },
};

const scrimFor = (at: NonNullable<TitleSpec["at"]>, k = 1) => {
  const x = at.includes("right") ? "88%" : at.includes("center") || at === "v-band" ? "50%" : "12%";
  const y = at.startsWith("bottom") ? "88%" : at.startsWith("top") || at === "v-top" ? "12%" : at === "v-low" ? "70%" : "50%";
  return `radial-gradient(60% 55% at ${x} ${y}, rgba(18,20,28,${0.62 * k}) 0%, rgba(18,20,28,${0.25 * k}) 45%, rgba(18,20,28,0) 75%)`;
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Small tracked kicker + brush title that paints in left-to-right
export const Title: React.FC<TitleSpec & { delay: number; exitAt: number; flat?: boolean }> = ({
  kicker,
  text,
  at = "bottom-left",
  size = 150,
  kickerSize = 24,
  scrim = 1,
  delay,
  exitAt,
  flat,
}) => {
  const frame = useCurrentFrame();
  if (!kicker && !text) return null;
  const alignRight = at.includes("right");
  const center = at.includes("center") || at === "v-band";
  const exit = interpolate(frame, [exitAt - 12, exitAt], [1, 0], clamp);
  const k = interpolate(frame, [delay, delay + 18], [0, 1], { ...clamp, easing: out });
  const w = interpolate(frame, [delay + 6, delay + 30], [0, 100], { ...clamp, easing: ease });
  const lift = interpolate(frame, [delay + 6, delay + 34], [26, 0], { ...clamp, easing: out });
  const rule = interpolate(frame, [delay + 4, delay + 26], [0, 1], { ...clamp, easing: out });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {flat ? null : <AbsoluteFill style={{ background: scrimFor(at, scrim), opacity: Math.max(k, w / 100) }} />}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", ...placement[at] }}>
        {kicker ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexDirection: alignRight ? "row-reverse" : "row",
              fontFamily: fonts.sans,
              fontWeight: 600,
              fontSize: kickerSize,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: colors.cream,
              opacity: k,
              translate: `0 ${(1 - k) * 14}px`,
              textShadow: "0 2px 18px rgba(18,20,28,0.55)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 3,
                background: colors.coral,
                scale: `${rule} 1`,
                transformOrigin: alignRight ? "right" : "left",
              }}
            />
            {kicker}
          </div>
        ) : null}
        {text ? (
          <div
            style={{
              fontFamily: fonts.brush,
              fontSize: size,
              lineHeight: 1.12,
              color: colors.cream,
              whiteSpace: "pre",
              textAlign: alignRight ? "right" : center ? "center" : "left",
              padding: "6px 30px 26px 4px",
              margin: alignRight ? "0 -30px 0 0" : "0 0 0 -4px",
              clipPath: `inset(-20% ${100 - w}% -20% -5%)`,
              translate: `0 ${lift}px`,
              rotate: "-3deg",
              textShadow: "0 6px 36px rgba(18,20,28,0.45)",
            }}
          >
            {text}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
