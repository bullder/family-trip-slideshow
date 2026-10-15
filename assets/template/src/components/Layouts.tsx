import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { colors, photoFilter } from "../theme";
import { WIDTH, HEIGHT } from "../timeline";
import { KenBurns, Move } from "./KenBurns";

export type Shot = { photo: string; focus?: string; move?: Move };

const SLANT = 90; // px the dividers lean, top vs bottom
const GAP = 7;

// Two or three portraits side by side, split by leaning dividers
export const Panels: React.FC<{ shots: Shot[]; dur: number; enter: number }> = ({
  shots,
  dur,
  enter,
}) => {
  const frame = useCurrentFrame();
  const n = shots.length;
  const step = WIDTH / n;
  return (
    <AbsoluteFill style={{ background: colors.night }}>
      {shots.map((s, i) => {
        // divider x positions at the top and bottom edges
        const lt = i === 0 ? -SLANT : i * step + SLANT / 2 + GAP;
        const lb = i === 0 ? -SLANT : i * step - SLANT / 2 + GAP;
        const rt = i === n - 1 ? WIDTH + SLANT : (i + 1) * step + SLANT / 2 - GAP;
        const rb = i === n - 1 ? WIDTH + SLANT : (i + 1) * step - SLANT / 2 - GAP;
        const left = Math.min(lt, lb);
        const width = Math.max(rt, rb) - left;
        // each panel arrives with a small vertical offset, alternating direction
        const arrive = interpolate(frame, [enter - 6 + i * 4, enter + 16 + i * 4], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const drift = interpolate(frame, [0, dur], [0, i % 2 ? -1.6 : 1.6]);
        return (
          <div
            key={s.photo}
            style={{
              position: "absolute",
              top: 0,
              left,
              width,
              height: HEIGHT,
              clipPath: `polygon(${lt - left}px 0, ${rt - left}px 0, ${rb - left}px 100%, ${lb - left}px 100%)`,
            }}
          >
            {/* oversized inner layer so the vertical arrival never exposes an edge */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -80,
                bottom: -80,
                translate: `0 ${(i % 2 ? -1 : 1) * arrive * 60 + drift * 10}px`,
              }}
            >
              <KenBurns photo={s.photo} focus={s.focus ?? "50% 28%"} move={s.move} dur={dur} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// A single portrait set on a flat colour field sampled from the photo
export const Framed: React.FC<{
  shot: Shot;
  dur: number;
  side?: "left" | "right";
  field: string;
}> = ({ shot, dur, side = "right", field }) => {
  const frame = useCurrentFrame();
  const cardH = 960;
  const cardW = Math.round((cardH * 2) / 3);
  const tilt = interpolate(frame, [0, dur], [side === "right" ? 2.2 : -2.2, side === "right" ? 0.6 : -0.6]);
  const rise = interpolate(frame, [0, dur], [14, -14]);
  return (
    <AbsoluteFill style={{ background: field }}>
      <div
        style={{
          position: "absolute",
          top: (HEIGHT - cardH) / 2,
          [side]: 190,
          width: cardW,
          height: cardH,
          rotate: `${tilt}deg`,
          translate: `0 ${rise}px`,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(`photos/${shot.photo}.jpg`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: photoFilter,
            scale: String(interpolate(frame, [0, dur], [1.02, 1.1])),
            transformOrigin: shot.focus ?? "50% 30%",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Warm grade + vignette over every slide
export const Grade: React.FC = () => (
  <>
    {/* lift the blacks toward plum */}
    <AbsoluteFill style={{ background: "#3a1e2a", opacity: 0.1, mixBlendMode: "lighten" }} />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, rgba(255,170,110,0.18) 0%, rgba(255,170,110,0) 40%, rgba(240,72,90,0) 65%, rgba(240,72,90,0.18) 100%)",
        mixBlendMode: "screen",
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(10,8,14,0.42) 100%)",
      }}
    />
  </>
);

// Sunset light leak that sweeps across a chapter opener
export const LightLeak: React.FC<{ start?: number; length?: number }> = ({ start = 0, length = 40 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = interpolate(p, [0, 0.25, 0.7, 1], [0, 0.85, 0.5, 0]);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          top: -380,
          left: -900 + p * 2600,
          background:
            "radial-gradient(closest-side, rgba(255,176,96,0.9) 0%, rgba(240,72,90,0.45) 45%, rgba(240,72,90,0) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
