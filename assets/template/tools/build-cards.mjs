// Build and render the four HyperFrames title cards from src/story.json.
// usage (from <project>/slideshow):  node tools/build-cards.mjs [--no-render] [--only intro,outro,intro-v,outro-v]
//
//   intro    16:9  kicker, place title, year digits, names; the lockup drops to the lower
//                  band as the blurred group photo sharpens
//   outro    16:9  the last group photo pulls back into a framed print with
//                  kicker / "Until next summer" / names
//   intro-v  9:16  same lockup, then the camera walks the group photo left to right,
//                  naming each person in story.intro.chain as they pass
//   outro-v  9:16  the last group photo kept whole in a full-width band; its sky and ground
//                  colours (sampled here, saved to story.outro.band) extend it
// Rendered MP4s go to public/hf/, where the Remotion compositions pick them up.
// Card length follows the bar grid: intro = bars[introEndBar],
// outro = totalSeconds - bars[outroStartBar] + the 12-frame cross-fade.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { bars as loadBars, escapeHtml, mediaEnv, PHOTOS, PROJECT, run, SLIDESHOW, SRC, story as loadStory, TOOLS, writeJson } from "./lib.mjs";

const CARDS = path.join(TOOLS, "cards");
const render = !process.argv.includes("--no-render");
const oi = process.argv.indexOf("--only");
const only = oi > 0 ? new Set(process.argv[oi + 1].split(",")) : null;
const story = loadStory();
const bars = loadBars();
const env = mediaEnv();

const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
async function edgeColours(file) {
  // average colour of the top and bottom eighth of the photo
  const { data } = await sharp(file).resize(1, 8, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { top: hex(data[0], data[1], data[2]), bottom: hex(data[21], data[22], data[23]) };
}
function fill(template, values) {
  let s = fs.readFileSync(path.join(CARDS, template), "utf8");
  for (const [k, v] of Object.entries(values)) s = s.split(`%%${k}%%`).join(String(v));
  const left = s.match(/%%[A-Z_]+%%/g);
  if (left) throw new Error(`${template}: unfilled placeholders ${[...new Set(left)].join(", ")}`);
  return s;
}

const { meta, timing, intro, outro } = story;
const names = meta.people.map((p) => p.name);
const introD = +bars[timing.introEndBar].toFixed(3);
const outroD = +(timing.totalSeconds - bars[timing.outroStartBar] + 0.4).toFixed(3);
const introPhoto = `${intro.photo}.jpg`, outroPhoto = `${outro.photo}.jpg`;
const { width: iw, height: ih } = await sharp(path.join(PHOTOS, introPhoto)).metadata();
const band = await edgeColours(path.join(PHOTOS, outroPhoto));
story.outro.band = band;
writeJson(path.join(SRC, "story.json"), story);

const common = {
  PLACE: escapeHtml(meta.place), YEAR: escapeHtml(meta.year),
  YEAR_SPANS: [...String(meta.year)].map((c) => `<span>${escapeHtml(c)}</span>`).join(""),
  NAMES_HTML: names.map(escapeHtml).join("<i>·</i>"),
};
const introVals = { ...common, DUR: introD, SCALE: +(introD / 8.3).toFixed(4), PHOTO: introPhoto, KICKER: escapeHtml(intro.kicker ?? "A family story") };
const outroScale = +Math.min(1, outroD / 7.5).toFixed(4);
const outroVals = {
  ...common, DUR: outroD, SCALE: outroScale, PHOTO: outroPhoto,
  KICKER: escapeHtml(outro.kicker ?? `${meta.place} · ${meta.year}`),
  TITLE: escapeHtml(outro.title ?? "Until next summer"),
  FADE_AT: +Math.max(outroD - 1.5, 3 * outroScale).toFixed(3),
};
const chain = intro.chain?.length ? intro.chain : names.map((n, k) => ({ name: n, x: (k + 0.5) / names.length }));
const who = chain.map((c, k) => `        <div class="who" id="who-${k}">${escapeHtml(c.name)}</div>`).join("\n");
const cards = {
  intro: fill("intro.html", { ...introVals, FOCUS: intro.focus ?? "50% 50%" }),
  outro: fill("outro.html", outroVals),
  "intro-v": fill("intro-v.html", { ...introVals, PHOTO_W: Math.round((1920 * iw) / ih), CHAIN: JSON.stringify(chain.map((c) => ({ x: c.x }))), WHO_HTML: who }),
  "outro-v": fill("outro-v.html", { ...outroVals, GROUND: band.bottom, BAND_GRADIENT: `linear-gradient(180deg, ${band.top} 0%, ${band.top} 420px, ${band.bottom} 1000px, ${band.bottom} 100%)` }),
};

const fonts = path.join(SLIDESHOW, "public", "fonts");
for (const [name, page] of Object.entries(cards)) {
  if (only && !only.has(name)) continue;
  const d = path.join(PROJECT, "cards", name);
  fs.mkdirSync(path.join(d, "assets", "fonts"), { recursive: true });
  for (const f of fs.readdirSync(fonts)) fs.copyFileSync(path.join(fonts, f), path.join(d, "assets", "fonts", f));
  for (const p of new Set([introPhoto, outroPhoto])) fs.copyFileSync(path.join(PHOTOS, p), path.join(d, "assets", p));
  for (const f of ["hyperframes.json", "package.json"]) fs.copyFileSync(path.join(CARDS, "base", f), path.join(d, f));
  fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify({ id: name, name }));
  fs.writeFileSync(path.join(d, "index.html"), page);
  const lint = run("npx", ["--yes", "hyperframes", "lint", "."], { cwd: d, env });
  const errs = lint.out.match(/(\d+) error\(s\)/);
  console.log(`${name}: lint ${errs ? errs[0] : "ran"}`);
  if (errs && errs[1] !== "0") {
    console.log(lint.out.slice(-3000));
    throw new Error(`${name}: fix lint errors before rendering`);
  }
  if (render) {
    const r = run("npx", ["--yes", "hyperframes", "render", ".", "-o", `renders/${name}.mp4`, "--fps", "30"], { cwd: d, env });
    const mp4 = path.join(d, "renders", `${name}.mp4`);
    if (r.status !== 0 || !fs.existsSync(mp4)) {
      console.log(r.out.slice(-3000));
      throw new Error(`${name}: render failed`);
    }
    fs.mkdirSync(path.join(SLIDESHOW, "public", "hf"), { recursive: true });
    fs.copyFileSync(mp4, path.join(SLIDESHOW, "public", "hf", `${name}.mp4`));
    console.log(`${name}: rendered ${name.startsWith("intro") ? introD : outroD}s -> public/hf/${name}.mp4`);
  }
}
