// Copy photos into the project at render size and build labelled contact sheets.
// usage (from <project>/slideshow):  node tools/prepare-photos.mjs <photos_dir>
//
//   public/photos/<id>.jpg   2400px long side, EXIF-rotated JPEG
//   review/thumbs/<id>.jpg   400px thumbnails
//   review/contact-NN.png    12 thumbnails per sheet, each labelled with its id
//   review/photos.json       id, file, width, height, orientation
// The id is the file stem with anything but letters/digits/-/_ replaced by "_".
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { isWin, PHOTOS, REVIEW, run, writeJson } from "./lib.mjs";

const src = process.argv[2];
if (!src) throw new Error("usage: node tools/prepare-photos.mjs <photos_dir>");
const thumbs = path.join(REVIEW, "thumbs");
fs.mkdirSync(PHOTOS, { recursive: true });
fs.mkdirSync(thumbs, { recursive: true });

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".avif", ".heic", ".heif"]);
const files = fs.readdirSync(src).filter((f) => EXT.has(path.extname(f).toLowerCase()) && !f.startsWith(".")).sort();
const index = [];
const skipped = [];
for (const f of files) {
  const id = path.parse(f).name.replace(/[^A-Za-z0-9_-]/g, "_");
  const out = path.join(PHOTOS, `${id}.jpg`);
  let input = path.join(src, f);
  if (!fs.existsSync(out)) {
    if (/\.hei[cf]$/i.test(f)) {
      // sharp's prebuilt libvips has no HEIC decoder. macOS can convert with sips; elsewhere ask for JPEGs.
      if (process.platform === "darwin") {
        const tmp = path.join(REVIEW, `${id}.heic.jpg`);
        run("sips", ["-s", "format", "jpeg", input, "--out", tmp]);
        input = tmp;
      } else {
        skipped.push(f);
        continue;
      }
    }
    await sharp(input).rotate().resize(2400, 2400, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
    if (input.endsWith(".heic.jpg")) fs.rmSync(input);
  }
  const th = path.join(thumbs, `${id}.jpg`);
  if (!fs.existsSync(th)) await sharp(out).resize(400, 400, { fit: "inside" }).jpeg({ quality: 82 }).toFile(th);
  const { width, height } = await sharp(out).metadata();
  index.push({ id, file: f, width, height, orientation: height > width * 1.05 ? "portrait" : width > height * 1.05 ? "landscape" : "square" });
}
writeJson(path.join(REVIEW, "photos.json"), index);

// contact sheets: 4×3 grid of 300px cells, id label in the corner
const CELL = 300, GAP = 4, COLS = 4;
for (let k = 0; k < index.length; k += 12) {
  const group = index.slice(k, k + 12);
  const rows = Math.ceil(group.length / COLS);
  const layers = [];
  for (const [i, p] of group.entries()) {
    const x = (i % COLS) * (CELL + GAP), y = Math.floor(i / COLS) * (CELL + GAP);
    const img = await sharp(path.join(thumbs, `${p.id}.jpg`)).resize(CELL, CELL, { fit: "contain", background: "#000" }).toBuffer();
    layers.push({ input: img, left: x, top: y });
    const w = 10 + p.id.length * 9;
    layers.push({
      input: Buffer.from(`<svg width="${w}" height="22"><rect width="${w}" height="22" fill="#ff0"/><text x="5" y="16" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="15">${p.id}</text></svg>`),
      left: x + 2, top: y + 2,
    });
  }
  await sharp({ create: { width: COLS * (CELL + GAP), height: rows * (CELL + GAP), channels: 3, background: "#000" } })
    .composite(layers).png().toFile(path.join(REVIEW, `contact-${String(k / 12).padStart(2, "0")}.png`));
}
const por = index.filter((p) => p.orientation === "portrait").length;
console.log(`${index.length} photos (${por} portrait, ${index.length - por} landscape/square)`);
console.log(`contact sheets: ${path.join(REVIEW, "contact-*.png")}`);
if (skipped.length) console.log(`skipped HEIC (export these as JPEG${isWin ? " — e.g. Photos app › Save as" : ""}): ${skipped.join(", ")}`);
