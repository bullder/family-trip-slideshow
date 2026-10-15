// Check src/story.json before rendering.
// usage (from <project>/slideshow):  node tools/validate.mjs
//
// Errors (exit 1): slides that don't tile introEndBar..outroStartBar exactly, missing photos,
// unknown kinds/transitions/placements, missing vertical layout, chain/people mismatch.
// Warnings: likely-too-wide titles, reused photos, portraits as a 16:9 "single",
// landscapes as a 9:16 "full".
import fs from "node:fs";
import path from "node:path";
import { bars as loadBars, PHOTOS, readJson, REVIEW, story as loadStory } from "./lib.mjs";

const KINDS = new Set(["single", "panels", "framed"]);
const TRANS = new Set(["fade", "slantR", "slantL", "tiltL", "tiltR", "push", "cut"]);
const AT_H = new Set(["bottom-left", "bottom-right", "bottom-center", "top-left", "top-right", "left", "right", "center"]);
const AT_V = new Set(["v-top", "v-low", "v-band"]);
const VKINDS = new Set(["full", "pan", "seq", "band"]);

const story = loadStory();
const bars = loadBars();
const pj = path.join(REVIEW, "photos.json");
const orient = Object.fromEntries(fs.existsSync(pj) ? readJson(pj).map((p) => [p.id, p.orientation]) : []);
const have = new Set(fs.readdirSync(PHOTOS).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)));
const errors = [], warns = [];
const { introEndBar: a, outroStartBar: b, totalSeconds } = story.timing;
if (!(0 < a && a < b && b < bars.length)) errors.push(`timing: need 0 < introEndBar (${a}) < outroStartBar (${b}) < ${bars.length} bars`);
if (totalSeconds <= bars[b] + 3) errors.push("timing: outro would be shorter than 3 s");
const photo = (id, where) => { if (!have.has(id)) errors.push(`${where}: photo '${id}' not in public/photos (ids are listed in review/photos.json)`); };

photo(story.intro.photo, "intro");
photo(story.outro.photo, "outro");
if (orient[story.outro.photo] === "portrait") warns.push("outro: a landscape group shot works best (the 9:16 ending keeps it whole in a band)");
const people = story.meta.people.map((p) => p.name);
const chain = (story.intro.chain ?? []).map((c) => c.name);
if (chain.length && [...chain].sort().join() !== [...people].sort().join()) errors.push(`intro.chain names ${chain} don't match meta.people ${people}`);
for (const c of story.intro.chain ?? []) if (!(c.x >= 0 && c.x <= 1)) errors.push(`intro.chain ${c.name}: x must be a 0–1 fraction of photo width`);

let cursor = a;
const used = {}, names = new Set();
story.slides.forEach((s, i) => {
  const w = `slide ${i} '${s.name}'`;
  if (names.has(s.name)) errors.push(`${w}: duplicate name (names are keys)`);
  names.add(s.name);
  if (s.bars[0] !== cursor) errors.push(`${w}: starts at bar ${s.bars[0]}, expected ${cursor} (slides must tile without gaps)`);
  if (s.bars[1] <= s.bars[0]) errors.push(`${w}: empty bar range`);
  cursor = s.bars[1];
  if (!KINDS.has(s.kind)) errors.push(`${w}: kind must be one of ${[...KINDS]}`);
  if (!TRANS.has(s.in)) errors.push(`${w}: in must be one of ${[...TRANS]}`);
  for (const sh of s.shots) {
    photo(sh.photo, w);
    (used[sh.photo] ??= []).push(s.name);
    if (s.kind === "single" && orient[sh.photo] === "portrait") warns.push(`${w}: portrait as a 16:9 single crops hard; consider panels/framed or check the focus`);
  }
  if (s.kind === "panels" && !(s.shots.length >= 2 && s.shots.length <= 3)) errors.push(`${w}: panels need 2–3 shots`);
  const ti = s.title;
  if (ti) {
    if (!AT_H.has(ti.at ?? "bottom-left")) errors.push(`${w}: title.at '${ti.at}' invalid for 16:9`);
    const width = (ti.text ?? "").length * (ti.size ?? 150) * 0.46;
    if (width > 1500) warns.push(`${w}: '${ti.text}' at ${ti.size ?? 150}px is ~${Math.round(width)}px wide; lower size`);
  }
  const v = s.vertical;
  if (!v) { errors.push(`${w}: missing vertical layout`); return; }
  const L = v.layout;
  if (!VKINDS.has(L.kind)) errors.push(`${w}: vertical.layout.kind must be one of ${[...VKINDS]}`);
  for (const id of [L.photo, ...(L.shots ?? []).map((x) => x.photo)].filter(Boolean)) {
    photo(id, `${w} (vertical)`);
    if (L.kind === "full" && orient[id] === "landscape") warns.push(`${w}: landscape as 9:16 'full' loses most of the frame; use 'pan'`);
  }
  if (ti && v.title) {
    if (!AT_V.has(v.title.at ?? "v-top")) errors.push(`${w}: vertical.title.at must be one of ${[...AT_V]}`);
    const text = v.title.text ?? ti.text ?? "";
    const vw = Math.max(...text.split("\n").map((x) => x.length)) * (v.title.size ?? 110) * 0.46;
    if (vw > 860) warns.push(`${w}: vertical line ~${Math.round(vw)}px wide at ${v.title.size ?? 110}px; break it with \\n or lower size (keep ≤ ~860px)`);
  }
});
if (cursor !== b) errors.push(`slides end at bar ${cursor}, but outroStartBar is ${b}`);
for (const [id, where] of Object.entries(used)) if (where.length > 1) warns.push(`photo ${id} used on ${where.length} slides: ${where}`);
warns.forEach((x) => console.log("warn:", x));
errors.forEach((x) => console.log("ERROR:", x));
console.log(`${story.slides.length} slides, bars ${a}–${b}, ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
