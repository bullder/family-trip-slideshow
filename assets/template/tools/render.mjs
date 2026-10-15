// Final renders + Reels cover.
// usage (from <project>/slideshow):  node tools/render.mjs <basename> [both|16x9|9x16]
//   e.g. node tools/render.mjs Sardinia-2027 both
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { bars as loadBars, durationSeconds, SLIDESHOW, story as loadStory } from "./lib.mjs";

const [name, which = "both"] = process.argv.slice(2);
if (!name) throw new Error("usage: node tools/render.mjs <basename> [both|16x9|9x16]");
const out = path.join(SLIDESHOW, "out");
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(SLIDESHOW, "src", "index.ts"), publicDir: path.join(SLIDESHOW, "public") });

async function renderVideo(id, file) {
  const composition = await selectComposition({ serveUrl, id });
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation: file,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) { last = p; process.stdout.write(`${id} ${p * 10}%  `); }
    },
  });
  console.log(`\n${file}  ${durationSeconds(file).toFixed(2)}s`);
}

if (which !== "9x16") await renderVideo("Slideshow", path.join(out, `${name}-family-slideshow.mp4`));
if (which !== "16x9") {
  await renderVideo("SlideshowVertical", path.join(out, `${name}-reels-9x16.mp4`));
  // cover: the opening lockup, centred so it survives the profile grid's 3:4 crop
  const story = loadStory();
  const frame = Math.round(loadBars()[story.timing.introEndBar] * 30 * 0.4);
  const composition = await selectComposition({ serveUrl, id: "SlideshowVertical" });
  await renderStill({ composition, serveUrl, frame, output: path.join(out, `${name}-reels-cover.jpg`), imageFormat: "jpeg", jpegQuality: 92 });
  console.log(path.join(out, `${name}-reels-cover.jpg`));
}
