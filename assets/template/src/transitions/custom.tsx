import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

const ease = Easing.bezier(0.7, 0, 0.2, 1);

type SlantProps = { from: "left" | "right" };

// Incoming slide sweeps across as a leaning panel; outgoing slide recedes
const SlantComponent: React.FC<TransitionPresentationComponentProps<SlantProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = ease(presentationProgress);
  const dir = passedProps.from === "right" ? 1 : -1;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          translate: `${-dir * p * 18}% 0`,
          scale: String(1 + p * 0.06),
          filter: `brightness(${1 - p * 0.45})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  // leading edge of the panel leans by 14% of the frame width
  const lead = (1 - p) * 114;
  const poly =
    dir === 1
      ? `polygon(${lead}% 0, 114% 0, 114% 100%, ${lead - 14}% 100%)`
      : `polygon(-14% 0, ${100 - lead + 14}% 0, ${100 - lead}% 100%, -14% 100%)`;
  return (
    <AbsoluteFill
      style={{
        clipPath: poly,
        translate: `${dir * (1 - p) * 10}% 0`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const slant = (props: SlantProps): TransitionPresentation<SlantProps> => ({
  component: SlantComponent,
  props,
});

type TiltProps = { angle?: number };

// Like the reference's tilted cards: incoming frame swings in rotated and oversized
const TiltComponent: React.FC<TransitionPresentationComponentProps<TiltProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const a = passedProps.angle ?? 9;
  const p = ease(presentationProgress);
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          scale: String(1 + p * 0.25),
          rotate: `${-p * a * 0.5}deg`,
          opacity: interpolate(p, [0.4, 1], [1, 0], { extrapolateLeft: "clamp" }),
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        scale: String(interpolate(p, [0, 1], [0.72, 1])),
        rotate: `${(1 - p) * a}deg`,
        translate: `0 ${(1 - p) * 30}%`,
        opacity: interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
        boxShadow: `0 30px 80px rgba(0,0,0,${0.5 * (1 - p)})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const tilt = (props: TiltProps = {}): TransitionPresentation<TiltProps> => ({
  component: TiltComponent,
  props,
});
