// Shared helpers for the slideshow tools. Works on Windows, macOS and Linux.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TOOLS = path.dirname(fileURLToPath(import.meta.url));
export const SLIDESHOW = path.dirname(TOOLS);
export const PROJECT = path.dirname(SLIDESHOW);
export const REVIEW = path.join(PROJECT, "review");
export const SRC = path.join(SLIDESHOW, "src");
export const PHOTOS = path.join(SLIDESHOW, "public", "photos");
export const isWin = process.platform === "win32";

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 1) + "\n");
export const story = () => readJson(path.join(SRC, "story.json"));
export const bars = () => readJson(path.join(SRC, "bars.json"));

// Quote an argument for cmd.exe (only used on Windows, where npx is a .cmd shim and needs a shell).
const q = (a) => (/[\s"&|<>^]/.test(a) ? `"${String(a).replace(/"/g, '""')}"` : String(a));

// Run a command, return {status, out}. `npx` works the same on every OS.
export function run(cmd, args, opts = {}) {
  const r = spawnSync(isWin ? [cmd, ...args].map(q).join(" ") : cmd, isWin ? [] : args, {
    cwd: opts.cwd ?? SLIDESHOW,
    env: opts.env ?? process.env,
    encoding: "utf8",
    shell: isWin,
    maxBuffer: 64 * 1024 * 1024,
    stdio: opts.inherit ? "inherit" : "pipe",
  });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

// Remotion ships ffmpeg/ffprobe in @remotion/compositor-<platform>. HyperFrames needs them on PATH.
// Windows: the folder holds ffmpeg.exe + its DLLs, so adding it to PATH is enough.
// macOS/Linux: the binaries need their dylib/so folder, so <project>/bin gets small wrapper scripts.
export function mediaEnv() {
  const nm = path.join(SLIDESHOW, "node_modules", "@remotion");
  const comp = fs.existsSync(nm) ? fs.readdirSync(nm).find((d) => d.startsWith("compositor-")) : null;
  const env = { ...process.env };
  const hasSystem = (b) => run(isWin ? "where" : "which", [b]).status === 0;
  if (hasSystem("ffmpeg") && hasSystem("ffprobe")) return env;
  if (!comp) throw new Error("Remotion compositor not installed; run setup first");
  const dir = path.join(nm, comp);
  let binDir = dir;
  if (!isWin) {
    binDir = path.join(PROJECT, "bin");
    fs.mkdirSync(binDir, { recursive: true });
    for (const b of ["ffmpeg", "ffprobe"]) {
      const w = path.join(binDir, b);
      fs.writeFileSync(w, `#!/bin/sh\nDYLD_LIBRARY_PATH="${dir}" LD_LIBRARY_PATH="${dir}" exec "${dir}/${b}" "$@"\n`);
      fs.chmodSync(w, 0o755);
    }
  }
  const key = Object.keys(env).find((k) => k.toLowerCase() === "path") ?? "PATH";
  env[key] = binDir + path.delimiter + (env[key] ?? "");
  return env;
}

// Media duration in seconds via Remotion's bundled ffprobe.
export function durationSeconds(file) {
  const r = run("npx", ["remotion", "ffprobe", "-hide_banner", file]);
  const m = r.out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`could not read duration of ${file}\n${r.out.slice(-800)}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

export const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
