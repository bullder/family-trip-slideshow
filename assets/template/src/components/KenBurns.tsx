import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { photoFilter } from "../theme";

export type Move = {
  // scale at the first and last frame of the slide
  zoom?: [number, number];
  // translate in % of the frame at the first and last frame
  pan?: [[number, number], [number, number]];
};

// One photo filling its parent with a slow, eased push/pull and drift
export const KenBurns: React.FC<{
  photo: string;
  focus?: string;
  move?: Move;
  dur: number;
  style?: React.CSSProperties;
}> = ({ photo, focus = "50% 40%", move = {}, dur, style }) => {
  const frame = useCurrentFrame();
  const durationInFrames = dur;
  const zoom = move.zoom ?? [1.04, 1.14];
  const pan = move.pan ?? [
    [0, 0],
    [0, 0],
  ];
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const scale = zoom[0] + (zoom[1] - zoom[0]) * t;
  const x = pan[0][0] + (pan[1][0] - pan[0][0]) * t;
  const y = pan[0][1] + (pan[1][1] - pan[0][1]) * t;

  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <Img
        src={staticFile(`photos/${photo}.jpg`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: focus,
          filter: photoFilter,
          scale: String(scale),
          translate: `${x}% ${y}%`,
          transformOrigin: focus,
        }}
      />
    </AbsoluteFill>
  );
};
