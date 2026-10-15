---
name: family-trip-slideshow
description: Turn a folder of holiday or family photos plus a music track into a finished, beat-synced family slideshow video. It renders a 16:9 TV cut and a 9:16 Instagram Reels cut, with animated brush-script titles, chapter kickers, an opening that names each person, and a "Until next summer" ending. It asks how many people are in the photos, their names and how to recognise each, the photo folder, the music, the place and the year. Use it whenever someone wants a slideshow, photo montage, travel or vacation video, family film, or Reel made from their own trip or family photos, even if they don't say "slideshow", e.g. "make a video from our Crete photos with this song".
compatibility: Windows, macOS or Linux with Node 18+ (no Python, Chrome or ffmpeg install needed). Needs network on first run for npm, Remotion's headless browser and npx hyperframes. Everything else (Remotion, HyperFrames, sharp, ffmpeg) is installed into the project.
---

# Family trip slideshow

This skill produces the same film as the Hurghada 2026 family slideshow it was
distilled from, for any family and any trip. The look is fixed and proven:
- Ken Burns photos, with slanted panels for portraits.
- A warm, slightly faded grade with sunset light leaks.
- Kaushan Script brush titles that paint in left to right on a −3° tilt, under small
  tracked-caps kickers with a coral rule.
- Every cut on a bar of the music.

Your job is the part that differs per trip: choosing and ordering photos, writing the
titles, and placing crops and text. Everything trip-specific goes in one file,
`slideshow/src/story.json`. Templates and scripts do the rest.

`<skill>` below means this skill's directory: `~/.claude/skills/family-trip-slideshow` on
macOS/Linux, `%USERPROFILE%\.claude\skills\family-trip-slideshow` on Windows.

All tools are Node scripts and run the same on every OS. On Windows, quote paths with
spaces (`"C:\Users\Anna\Pictures\Crete 2027"`). Forward or back slashes both work.
After setup, every command runs from `<project>/slideshow`.

## 1. Ask for the inputs

Ask with the question tool, in one or two rounds. Ask only for what the request
doesn't already answer.

1. **How many people** appear in the photos, then for each person: **name** and a short
   **"how to recognise them"** (clothing, hair, role: "dad, navy tee", "younger
   daughter, black tee"). This is what lets you tell people apart on the contact
   sheets.
2. **Photo folder** (path).
3. **Music** (an mp3 or other audio file). Videos run up to 3 minutes; a longer track
   is cut and faded.
4. **Place** and **year** (the opening title and year digits).
5. **Formats**: TV 16:9, Instagram 9:16, or both (default both).

Pick a project folder, `<home>/<place>-<year>-slideshow` (lowercase, dashes) unless the
user names one, and say which.

## 2. Set up

```bash
node <skill>/scripts/setup.mjs <project> <music>
cd <project>/slideshow
node tools/prepare-photos.mjs <photo_folder>
node tools/beats.mjs
```

- `setup.mjs` copies the template, runs `npm install`, and fetches Remotion's headless
  browser once, so the first stills run doesn't stall.
- `prepare-photos.mjs` writes 2400px, EXIF-rotated JPEGs to `public/photos/<id>.jpg`,
  contact sheets `review/contact-NN.png` labelled with each id, and
  `review/photos.json` with orientations. HEIC is converted on macOS; on Windows and
  Linux it's skipped with a note, so ask the user to export those photos as JPEG.
- `beats.mjs` runs `hyperframes beats`, writes `src/bars.json`, and prints the plan:
  total length, `introEndBar`, `outroStartBar`, the number of bars the slides must
  fill, and the surge bars.

## 3. Look at every photo, then write the story

Read every contact sheet image. For each photo, note who is in it (using the
descriptions), the setting, the time of day, its orientation, and any near-duplicates.
Then read `references/craft.md` (story shape, title voice, crops, the 9:16 rules) and
`references/story-format.md` (the schema). Use `references/example-story.json` as the
model to imitate; it is the approved Hurghada film.

Write `slideshow/src/story.json`. Use photo ids exactly as they appear in
`review/photos.json`.
- `meta`: place, year, people (in the order the user listed them).
- `timing`: from the beat plan.
- `intro`: a side-by-side group photo, plus a `chain` with each person's x position,
  left to right as they stand in the photo.
- `outro`: a landscape group shot, ideally a sunset or silhouette.
- `slides`: tiling every bar from `introEndBar` to `outroStartBar`, each with its
  `vertical` layout.

Write every title fresh from these photos. The example's titles belong to another
family; reusing them makes the film generic.

If a person's identity is genuinely ambiguous (look-alike siblings), ask the user one
specific question before writing names into titles. A wrong name on a family video is
the one mistake they will definitely notice.

```bash
node tools/validate.mjs
```

Fix every ERROR, and read the warnings (too-wide titles, portraits as 16:9 singles,
reused photos). Then write the readable plan, listing the near-duplicates you skipped:

```bash
node tools/scenario.mjs --skipped "IMG_0102=dup of IMG_0101, IMG_0230=blurry"
```

## 4. Title cards

```bash
node tools/build-cards.mjs
```

This fills the four HyperFrames card templates (intro and outro, 16:9 and 9:16) with
the place, year, names, chain and photos, then lints and renders them into
`slideshow/public/hf/`. HyperFrames needs ffmpeg; the script puts Remotion's bundled
copy on PATH automatically, so nothing has to be installed. It also samples the outro photo's sky and ground colours into
`story.outro.band`. Re-run it whenever intro, outro, meta or timing change.

## 5. Check stills, fix, render

```bash
node tools/stills.mjs Slideshow ../review/s1
node tools/stills.mjs SlideshowVertical ../review/v1 --guides
```

Run the two one after another, not in parallel. Each slide is captured twice: once
after its title has painted, and once at its end, so the last shot of a 9:16 sequence
is checked too.

Read every sheet and fix in one batch:
- Heads or faces cut off.
- Titles on faces, hands or busy prints.
- A title over the wrong photo.
- 9:16 faces inside the tinted UI zones.
- Grade jumps between slides.

Re-render only the frames you changed (pass frame numbers to `tools/stills.mjs`) to confirm.
Stop after at most two rounds; endless polishing helps less than shipping.

Then render:

```bash
node tools/render.mjs <Place>-<Year> both   # or 16x9 / 9x16
```

## 6. Report

Tell the user, briefly:
- Where the files are: `<Place>-<Year>-family-slideshow.mp4`,
  `<Place>-<Year>-reels-9x16.mp4`, and `<Place>-<Year>-reels-cover.jpg` (choose it as
  the Reel cover in the Instagram app).
- The length.
- The chapter list with titles.
- Which photos were skipped.
- Any identity assumptions you made.

Offer `npx remotion studio` (run in `<project>/slideshow`) if they want to tweak
timing or text visually.
