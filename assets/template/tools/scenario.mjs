// Write <project>/SCENARIO.md from story.json: a readable plan of the film.
// usage (from <project>/slideshow):
//   node tools/scenario.mjs [--skipped "IMG_0102=dup of IMG_0101, IMG_0230=blurry"]
import fs from "node:fs";
import path from "node:path";
import { bars as loadBars, PROJECT, story as loadStory } from "./lib.mjs";

const story = loadStory();
const bars = loadBars();
const si = process.argv.indexOf("--skipped");
const skipped = si > 0 ? process.argv[si + 1] : "";
const ts = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const title = (t) => (t ? [t.kicker && `*${t.kicker.toUpperCase()}*`, t.text && `**${t.text}**`].filter(Boolean).join(" / ") : "—");
const { meta: m, timing: t, intro, outro } = story;
const L = [
  `# ${m.place} ${m.year} — slideshow scenario`, "",
  `**People:** ${m.people.map((p) => `${p.name} (${p.who ?? ""})`).join(", ")}`,
  `**Length:** ${ts(t.totalSeconds)} · 16:9 + 9:16 · cuts on bar downbeats`, "",
  "| # | Time | Bars | Photos (16:9) | 9:16 layout | On-screen text |", "|---|---|---|---|---|---|",
  `| 0 | 0:00 | intro | ${intro.photo} | walk the chain: ${(intro.chain ?? []).map((c) => c.name).join(" → ")} | *${(intro.kicker ?? "A family story").toUpperCase()}* · **${m.place}** · ${m.year} · names |`,
];
story.slides.forEach((s, i) => {
  const v = s.vertical?.layout ?? {};
  const vdesc = v.kind === "seq" ? `seq ${v.shots.map((x) => x.photo).join(" + ")}` : `${v.kind ?? "?"} ${v.photo ?? ""}`;
  L.push(`| ${i + 1} | ${ts(bars[s.bars[0]])} | ${s.bars[0]}–${s.bars[1]} | ${s.kind}: ${s.shots.map((x) => x.photo).join(" + ")} | ${vdesc.trim()} | ${title(s.title)} |`);
});
L.push(`| — | ${ts(bars[t.outroStartBar])} | outro | ${outro.photo} | band | *${(outro.kicker ?? "").toUpperCase()}* / **${outro.title ?? "Until next summer"}** / names |`);
if (skipped) L.push("", `**Skipped:** ${skipped}`);
fs.writeFileSync(path.join(PROJECT, "SCENARIO.md"), L.join("\n") + "\n");
console.log(`wrote ${path.join(PROJECT, "SCENARIO.md")}`);
