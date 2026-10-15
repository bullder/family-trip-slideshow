import bars from "./bars.json";
import story from "./story.json";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = Math.round(story.timing.totalSeconds * FPS);

// Downbeat of bar `i` (from `hyperframes beats`, via tools/beats.mjs), in frames
export const barFrame = (i: number) => Math.round(bars[i] * FPS);
