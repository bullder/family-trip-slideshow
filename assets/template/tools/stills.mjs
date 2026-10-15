// Render review stills from a composition and lay them out on contact sheets.
// usage (from <project>/slideshow):
//   node tools/stills.mjs <Slideshow|SlideshowVertical> <outDir> [frames...] [--guides]
// With no frames: the intro twice, every slide twice (~1.3 s in, once its title has painted,
// and just before its end, so the last shot of a 9:16 sequence is seen too), the outro twice.
// --guides tints Instagram Reels' UI zones on 9:16 sheets (top bar, caption area, action column).
// Run the 16:9 and 9:16 checks one after another, not in parallel.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { bars as loadBars, SLIDESHOW, story as loadStory } from "./lib.mjs";

const args = process.argv.slice(2);
const guides = args.includes("--guides");
const [id, outArg, ...rest] = args.filter((a) => a !== "--guides");
const outDir = path.resolve(outArg);
fs.mkdirSync(outDir, { recursive: true });
const story = loadStory();
const bars = loadBars();
const f = (i) => Math.round(bars[i] * 30);
let frames = rest.map(Number);
if (!frames.length) {
  const ie = f(story.timing.introEndBar);
  frames = [Math.round(ie * 0.47), Math.round(ie * 0.9)];
  for (const s of story.slides) {
    const a = f(s.bars[0]);
    const b = f(s.bars[1]);
    frames.push(Math.min(a + 40, b - 20), b - 16);
  }
  const o = f(story.timing.outroStartBar);
  frames.push(o + 150, Math.round(story.timing.totalSeconds * 30) - 75);
}
frames = [...new Set(frames)].sort((x, y) => x - y);

const serveUrl = await bundle({ entryPoint: path.join(SLIDESHOW, "src", "index.ts"), publicDir: path.join(SLIDESHOW, "public") });
const composition = await selectComposition({ serveUrl, id });
for (const fr of frames) {
  await renderStill({ composition, serveUrl, frame: fr, output: path.join(outDir, `f${String(fr).padStart(4, "0")}.jpg`), imageFormat: "jpeg", scale: 0.5 });
}

// contact sheets
const vertical = composition.height > composition.width;
const [cols, per, cw, ch] = vertical ? [5, 10, 300, 533] : [3, 9, 640, 360];
const files = fs.readdirSync(outDir).filter((x) => /^f\d+\.jpg$/.test(x)).sort();
const s = cw / 1080;
const guideSvg = Buffer.from(
  `<svg width="${cw}" height="${ch}"><g fill="rgba(255,0,0,0.25)">` +
  `<rect x="0" y="0" width="${cw}" height="${220 * s}"/><rect x="0" y="${ch - 420 * s}" width="${cw}" height="${420 * s}"/>` +
  `<rect x="${cw - 150 * s}" y="${ch - 1020 * s}" width="${150 * s}" height="${600 * s}"/></g></svg>`);
for (let k = 0; k < files.length; k += per) {
  const group = files.slice(k, k + per);
  const layers = [];
  for (const [i, file] of group.entries()) {
    const left = (i % cols) * (cw + 4), top = Math.floor(i / cols) * (ch + 4);
    layers.push({ input: await sharp(path.join(outDir, file)).resize(cw, ch, { fit: "fill" }).toBuffer(), left, top });
    if (vertical && guides) layers.push({ input: guideSvg, left, top });
    layers.push({ input: Buffer.from(`<svg width="44" height="18"><rect width="44" height="18" fill="#ff0"/><text x="3" y="14" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="13">${file.slice(1, 5)}</text></svg>`), left, top });
  }
  const rows = Math.ceil(group.length / cols);
  await sharp({ create: { width: cols * (cw + 4), height: rows * (ch + 4), channels: 3, background: "#000" } })
    .composite(layers).png().toFile(path.join(outDir, `sheet${k / per}.png`));
}
console.log(`${frames.length} stills -> ${path.join(outDir, "sheet*.png")}`);
