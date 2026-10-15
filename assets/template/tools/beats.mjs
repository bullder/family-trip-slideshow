// Find the music's bar grid with `hyperframes beats` and plan the timeline.
// usage (from <project>/slideshow):  node tools/beats.mjs [--max-seconds 180]
//
// Writes src/bars.json (downbeat time of every bar, seconds) and review/music.json, and
// prints the plan: total length, intro/outro bars, how many bars the slides must fill,
// and the surge bars (put chapter openers and the emotional peak there).
import fs from "node:fs";
import path from "node:path";
import { durationSeconds, PROJECT, readJson, REVIEW, run, SLIDESHOW, SRC, TOOLS, writeJson } from "./lib.mjs";

const i = process.argv.indexOf("--max-seconds");
const maxS = i > 0 ? Number(process.argv[i + 1]) : 180;
const music = path.join(SLIDESHOW, "public", "music.mp3");

const work = path.join(PROJECT, "cards", "_beats");
fs.mkdirSync(path.join(work, "assets"), { recursive: true });
fs.copyFileSync(music, path.join(work, "assets", "bgm.mp3"));
fs.copyFileSync(path.join(TOOLS, "cards", "base", "hyperframes.json"), path.join(work, "hyperframes.json"));
fs.writeFileSync(path.join(work, "index.html"),
  '<!doctype html><html><body><div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080">' +
  '<audio id="bgm" data-timeline-role="music" src="assets/bgm.mp3" data-start="0" data-duration="10" data-track-index="11"></audio>' +
  "</div></body></html>");
const r = run("npx", ["--yes", "hyperframes", "beats", ".", "--json"], { cwd: work });
const out = path.join(work, "beats", "assets", "bgm.mp3.json");
if (!fs.existsSync(out)) throw new Error(`hyperframes beats failed:\n${r.out.slice(-3000)}`);
const beats = readJson(out).beats;
const t = beats.map((b) => b.time);
const s = beats.map((b) => b.strength);

const duration = durationSeconds(music);
const total = Math.floor(Math.min(duration, maxS) * 30) / 30;

// The tracker reports beats; a bar is 8 of them at its doubled tempo (or 4 at true tempo).
const gaps = t.slice(1).map((x, k) => x - t[k]).sort((a, b) => a - b);
const perBar = gaps[Math.floor(gaps.length / 2)] < 0.4 ? 8 : 4;
const n = Math.floor(s.length / perBar) * perBar;
let phase = 0, best = -1;
for (let p = 0; p < perBar; p++) {
  let sum = 0;
  for (let k = p; k < n; k += perBar) sum += s[k];
  if (sum > best) [best, phase] = [sum, p];
}
const bars = [];
for (let k = phase; k < t.length; k += perBar) if (t[k] < total) bars.push(+t[k].toFixed(3));
writeJson(path.join(SRC, "bars.json"), bars);

const barLen = (bars.at(-1) - bars[0]) / Math.max(1, bars.length - 1);
const introEndBar = bars.findIndex((b) => b >= 7.0);
let outroStartBar = 0;
bars.forEach((b, k) => { if (total - b >= 6.5) outroStartBar = k; });
const energy = bars.map((_, k) => {
  const w = s.slice(phase + k * perBar, phase + (k + 1) * perBar);
  return w.length ? +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(3) : 0;
});
const surgeBars = energy.map((e, k) => [k, k ? e - energy[k - 1] : -1]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k).sort((a, b) => a - b);
const plan = {
  musicSeconds: +duration.toFixed(2), totalSeconds: total, barSeconds: +barLen.toFixed(3),
  bpm: +(60 / (barLen / 4)).toFixed(1), bars: bars.length,
  introEndBar, introSeconds: bars[introEndBar],
  outroStartBar, outroCardSeconds: +(total - bars[outroStartBar] + 0.4).toFixed(2), // incl. the 12-frame cross-fade
  slideBars: outroStartBar - introEndBar, surgeBars, energyPerBar: energy,
};
fs.mkdirSync(REVIEW, { recursive: true });
writeJson(path.join(REVIEW, "music.json"), plan);
const { energyPerBar, ...shown } = plan;
console.log(JSON.stringify(shown, null, 1));
if (duration > maxS) console.log(`note: track is ${duration.toFixed(0)}s; the video is capped at ${total.toFixed(0)}s and the music fades out`);
