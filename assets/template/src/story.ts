import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { pushCut } from "@remotion/transitions/push-cut";
import type { Move } from "./components/KenBurns";
import type { Shot } from "./components/Layouts";
import type { TitleSpec } from "./components/Title";
import storyJson from "./story.json";
import { slant, tilt } from "./transitions/custom";

// Everything that differs between trips lives in story.json; this file only types it.

export type VLayout =
  | { kind: "full"; photo: string; focus: string }
  | { kind: "pan"; photo: string; from: number; to: number; y?: number }
  | { kind: "seq"; shots: { photo: string; focus: string; zoom?: [number, number]; shift?: number }[] }
  | { kind: "band"; photo: string };

export type VSpec = {
  layout: VLayout;
  title?: Pick<TitleSpec, "at" | "size" | "text" | "scrim" | "kickerSize">;
  titleOnFirst?: boolean;
};

export type TransitionName = "fade" | "slantR" | "slantL" | "tiltL" | "tiltR" | "push" | "cut";

export type Slide = {
  name: string;
  kind: "single" | "panels" | "framed";
  shots: (Shot & { move?: Move })[];
  bars: [number, number];
  title?: TitleSpec;
  side?: "left" | "right";
  // chapter look on top of the shared grade: lush (calms saturated greens), azure (calms cyan skies)
  grade?: "lush" | "azure";
  // one-off CSS filter that replaces the chapter look
  filter?: string;
  // flat colour behind a framed portrait
  field?: string;
  leak?: boolean;
  in: TransitionName;
  inT: number;
  vertical: VSpec;
};

export type Story = {
  meta: { place: string; year: string; people: { name: string; who?: string }[] };
  timing: { introEndBar: number; outroStartBar: number; totalSeconds: number };
  intro: { photo: string; focus?: string; kicker?: string; chain: { name: string; x: number }[] };
  // band: colours sampled from the top and bottom edge of the outro photo (tools/build-cards.mjs fills them in)
  outro: { photo: string; kicker?: string; title?: string; band?: { top: string; bottom: string } };
  slides: Slide[];
};

export const story = storyJson as unknown as Story;
export const slides = story.slides;

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;
const presentations: Record<Exclude<TransitionName, "cut">, AnyPresentation> = {
  fade: fade() as unknown as AnyPresentation,
  slantR: slant({ from: "right" }) as unknown as AnyPresentation,
  slantL: slant({ from: "left" }) as unknown as AnyPresentation,
  tiltL: tilt({ angle: 9 }) as unknown as AnyPresentation,
  tiltR: tilt({ angle: -9 }) as unknown as AnyPresentation,
  push: pushCut({ flashColor: "#fff4e4", flashOpacity: 0.5 }) as unknown as AnyPresentation,
};
export const presentationFor = (n: TransitionName) => presentations[n === "cut" ? "fade" : n];
// a "cut" (or inT 0) is a hard cut on the downbeat
export const inFrames = (s: Slide) => (s.in === "cut" ? 0 : s.inT);

export const chapterFilter = (s: Slide) =>
  s.filter ??
  (s.grade === "lush" ? "saturate(0.82)" : s.grade === "azure" ? "saturate(0.76) hue-rotate(6deg) sepia(0.06)" : undefined);

export const fd = presentations.fade;
export const OUTRO_IN = 12;
