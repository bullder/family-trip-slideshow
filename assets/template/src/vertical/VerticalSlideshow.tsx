import React from "react";
import { Video } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "../theme";
import { photoFilter } from "../theme";
import { KenBurns } from "../components/KenBurns";
import { Grade, LightLeak } from "../components/Layouts";
import { Title } from "../components/Title";
import { Music, buildSeries } from "../Slideshow";
import { chapterFilter, fd, inFrames, OUTRO_IN, Slide, story } from "../story";
import { barFrame, TOTAL_FRAMES } from "../timeline";

// Each slide's 9:16 re-composition lives in story.json (slide.vertical):
// "full": a portrait fills the frame. "pan": a landscape group shot is walked
// left→right so each person passes the centre. "seq": a diptych/triptych becomes
// full-screen portraits cut on the beat. "band": the closing silhouettes stay whole.

const ease = Easing.bezier(0.45, 0, 0.55, 1);

// Landscape walked across a tall frame by sliding the cover crop
const Pan: React.FC<{ photo: string; from: number; to: number; y?: number; dur: number }> = ({ photo, from, to, y = 45, dur }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(`photos/${photo}.jpg`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${x}% ${y}%`,
          filter: photoFilter,
          scale: String(interpolate(frame, [0, dur], [1.06, 1.0])),
        }}
      />
    </AbsoluteFill>
  );
};

// Portraits shown one after another, each sliced in on its share of the slot
const Seq: React.FC<{ shots: { photo: string; focus: string; zoom?: [number, number]; shift?: number }[]; dur: number; enter: number }> = ({ shots, dur, enter }) => {
  const frame = useCurrentFrame();
  const slot = (dur - enter) / shots.length;
  return (
    <AbsoluteFill style={{ background: "#12141c" }}>
      {shots.map((s, i) => {
        const start = i === 0 ? 0 : Math.round(enter + i * slot) - 10;
        if (frame < start) return null;
        const p = i === 0 ? 1 : interpolate(frame, [start, start + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.7, 0, 0.2, 1) });
        // leaning wipe rising from the bottom, like the 16:9 slant
        const top = (1 - p) * 112;
        return (
          <AbsoluteFill key={s.photo} style={{ clipPath: `polygon(0 ${top}%, 100% ${top - 12}%, 100% 112%, 0 112%)` }}>
            <KenBurns photo={s.photo} focus={s.focus} move={{ zoom: s.zoom ?? (i % 2 ? [1.12, 1.02] : [1.02, 1.12]), pan: s.shift ? [[s.shift, 0], [s.shift, 0]] : undefined }} dur={dur} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// The closing group shot kept whole: its sky extends above, its ground below (matches the HyperFrames outro)
const band = story.outro.band ?? { top: "#c9761c", bottom: "#000000" };
export const bandGradient = `linear-gradient(180deg, ${band.top} 0px, ${band.top} 420px, ${band.bottom} 1000px, ${band.bottom} 100%)`;
const Band: React.FC<{ photo: string; dur: number }> = ({ photo, dur }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: bandGradient }}>
      <div
        style={{
          position: "absolute",
          left: -97,
          top: 330,
          width: 1274,
          height: 849,
          maskImage: "linear-gradient(180deg, transparent 0%, #000 9%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 9%)",
          transformOrigin: "50% 100%",
          scale: String(interpolate(frame, [0, dur], [1.04, 1.0])),
        }}
      >
        <Img src={staticFile(`photos/${photo}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.9) sepia(0.08)" }} />
      </div>
    </AbsoluteFill>
  );
};

const VScene: React.FC<{ slide: Slide; dur: number; exitAt: number }> = ({ slide, dur, exitAt }) => {
  const spec = slide.vertical;
  const L = spec.layout;
  const enter = inFrames(slide);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: L.kind === "band" ? undefined : chapterFilter(slide) }}>
        {L.kind === "full" ? (
          <KenBurns photo={L.photo} focus={L.focus} move={slide.shots[0]?.move} dur={dur} />
        ) : L.kind === "pan" ? (
          <Pan photo={L.photo} from={L.from} to={L.to} y={L.y} dur={dur} />
        ) : L.kind === "seq" ? (
          <Seq shots={L.shots} dur={dur} enter={enter} />
        ) : (
          <Band photo={L.photo} dur={dur} />
        )}
      </AbsoluteFill>
      {slide.grade === "azure" ? <AbsoluteFill style={{ background: "rgba(255,150,110,0.28)", mixBlendMode: "soft-light" }} /> : null}
      {L.kind === "band" ? null : <Grade />}
      {slide.leak ? <LightLeak start={Math.max(0, enter - 14)} length={slide.title?.style === "stroke" ? 46 : 32} /> : null}
      {slide.title ? (
        <Title
          {...slide.title}
          {...spec.title}
          at={spec.title?.at ?? "v-top"}
          size={spec.title?.size ?? 110}
          delay={enter + 2}
          exitAt={
            spec.titleOnFirst && L.kind === "seq"
              ? Math.round(enter + (dur - enter) / L.shots.length) - 10
              : exitAt
          }
          flat={L.kind === "band"}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const VerticalSlideshow: React.FC = () => {
  const { fps } = useVideoConfig();
  const introEnd = barFrame(story.timing.introEndBar);
  const outroStart = barFrame(story.timing.outroStartBar);
  return (
    <AbsoluteFill style={{ backgroundColor: "#12141c" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro (HyperFrames, 9:16)" durationInFrames={introEnd} premountFor={fps}>
          <Video src={staticFile("hf/intro-v.mp4")} muted premountFor={fps} />
        </TransitionSeries.Sequence>
        {buildSeries((s, dur, exitAt) => <VScene slide={s} dur={dur} exitAt={exitAt} />, fps)}
        <TransitionSeries.Transition presentation={fd} timing={linearTiming({ durationInFrames: OUTRO_IN })} />
        <TransitionSeries.Sequence name="Outro (HyperFrames, 9:16)" durationInFrames={TOTAL_FRAMES - outroStart + OUTRO_IN} premountFor={fps}>
          <Video src={staticFile("hf/outro-v.mp4")} muted premountFor={fps} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Music />
    </AbsoluteFill>
  );
};
