// Create a slideshow project from the bundled template. Node built-ins only; works on
// Windows, macOS and Linux.
// usage: node <skill>/scripts/setup.mjs <project_dir> <music_file>
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [projectArg, music] = process.argv.slice(2);
if (!projectArg || !music) {
  console.error("usage: node setup.mjs <project_dir> <music_file>");
  process.exit(1);
}
const skill = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project = path.resolve(projectArg);
const slideshow = path.join(project, "slideshow");
const isWin = process.platform === "win32";
const q = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);
const run = (cmd, args) => {
  const r = spawnSync(isWin ? [cmd, ...args].map(q).join(" ") : cmd, isWin ? [] : args, { cwd: slideshow, stdio: "inherit", shell: isWin });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`);
};

if (fs.existsSync(path.join(slideshow, "package.json"))) {
  console.log(`Project already exists at ${project}; reusing it.`);
} else {
  fs.mkdirSync(project, { recursive: true });
  fs.cpSync(path.join(skill, "assets", "template"), slideshow, { recursive: true });
}
for (const d of [["public", "photos"], ["public", "hf"], ["out"]]) fs.mkdirSync(path.join(slideshow, ...d), { recursive: true });
fs.mkdirSync(path.join(project, "review"), { recursive: true });
fs.copyFileSync(music, path.join(slideshow, "public", "music.mp3"));

if (!fs.existsSync(path.join(slideshow, "node_modules"))) run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"]);
// Remotion's headless browser (~170 MB, once) so the first stills/render run isn't a 10-minute stall
run("npx", ["remotion", "browser", "ensure"]);
console.log(`Project ready: ${project}`);
console.log(`Next (from ${slideshow}): node tools/prepare-photos.mjs <photos_dir>`);
