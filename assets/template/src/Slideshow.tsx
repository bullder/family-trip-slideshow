import React from "react";
import { Audio, Video } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./theme";
import { KenBurns } from "./components/KenBurns";
import { Framed, Grade, LightLeak, Panels } from "./components/Layouts";
import { Title } from "./components/Title";
import { chapterFilter, fd, inFrames, OUTRO_IN, presentationFor, Slide, slides, story } from "./story";
import { barFrame, TOTAL_FRAMES } from "./timeline";

const SlideScene: React.FC<{ slide: Slide; dur: number; exitAt: number }> = ({ slide, dur, exitAt }) => {
  const enter = inFrames(slide);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: chapterFilter(slide) }}>
        {slide.kind === "single" ? (
          <KenBurns photo={slide.shots[0].photo} focus={slide.shots[0].focus} move={slide.shots[0].move} dur={dur} />
        ) : slide.kind === "panels" ? (
          <Panels shots={slide.shots} dur={dur} enter={enter} />
        ) : (
          <Framed shot={slide.shots[0]} dur={dur} side={slide.side} field={slide.field ?? "#12141c"} />
        )}
      </AbsoluteFill>
      {slide.grade === "azure" ? (
        // warms a cyan sky without shifting skin
        <AbsoluteFill style={{ background: "rgba(255,150,110,0.28)", mixBlendMode: "soft-light" }} />
      ) : null}
      <Grade />
      {slide.leak ? <LightLeak start={Math.max(0, enter - 14)} length={slide.title?.style === "stroke" ? 46 : 32} /> : null}
      {slide.title ? <Title {...slide.title} delay={enter + 2} exitAt={exitAt} flat={slide.kind === "framed"} /> : null}
    </AbsoluteFill>
  );
};

export const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Audio
      name="Music"
      src={staticFile("music.mp3")}
      volume={interpolate(frame, [0, 0.4 * fps, durationInFrames - 4 * fps, durationInFrames - 1], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })}
    />
  );
};

// Every sequence = its bar slot + the transition that overlaps its head,
// so each transition finishes exactly on a downbeat.
export const buildSeries = (
  render: (s: Slide, dur: number, exitAt: number) => React.ReactNode,
  fps: number,
) => {
  const outroStart = barFrame(story.timing.outroStartBar);
  return slides.map((s, i) => {
    const start = barFrame(s.bars[0]);
    const end = s.bars[1] === story.timing.outroStartBar ? outroStart : barFrame(s.bars[1]);
    const t = inFrames(s);
    const dur = end - start + t;
    // titles clear before the next transition starts; the last slide's title rides the cross-fade out
    const next = slides[i + 1];
    const exitAt = next ? dur - Math.max(inFrames(next), 6) - 2 : dur + 12;
    return (
      <React.Fragment key={s.name}>
        {t > 0 ? <TransitionSeries.Transition presentation={presentationFor(s.in)} timing={linearTiming({ durationInFrames: t })} /> : null}
        <TransitionSeries.Sequence name={s.name} durationInFrames={dur} premountFor={fps}>
          {render(s, dur, exitAt)}
        </TransitionSeries.Sequence>
      </React.Fragment>
    );
  });
};

export const Slideshow: React.FC = () => {
  const { fps } = useVideoConfig();
  const introEnd = barFrame(story.timing.introEndBar);
  const outroStart = barFrame(story.timing.outroStartBar);
  return (
    <AbsoluteFill style={{ backgroundColor: "#12141c" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro (HyperFrames)" durationInFrames={introEnd} premountFor={fps}>
          <Video src={staticFile("hf/intro.mp4")} muted premountFor={fps} />
        </TransitionSeries.Sequence>
        {buildSeries((s, dur, exitAt) => <SlideScene slide={s} dur={dur} exitAt={exitAt} />, fps)}
        <TransitionSeries.Transition presentation={fd} timing={linearTiming({ durationInFrames: OUTRO_IN })} />
        <TransitionSeries.Sequence name="Outro (HyperFrames)" durationInFrames={TOTAL_FRAMES - outroStart + OUTRO_IN} premountFor={fps}>
          <Video src={staticFile("hf/outro.mp4")} muted premountFor={fps} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Music />
    </AbsoluteFill>
  );
};
