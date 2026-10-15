# family-trip-slideshow

[github.com/bullder/family-trip-slideshow](https://github.com/bullder/family-trip-slideshow)

> **New to this, and on Windows?** Follow the step-by-step
> **[Windows setup guide for beginners](docs/WINDOWS.md)**. It covers installing Claude
> Desktop, Node.js and Git, then making your first video.

A Claude Code skill that turns a folder of trip or family photos plus a song into a
finished, beat-synced slideshow video. You get two cuts from one story:

- **TV cut**: 16:9, 1920×1080
- **Instagram Reels cut**: 9:16, 1080×1920, plus a cover image

Both cuts use the same look:
- Slow Ken Burns moves, with slanted panels for portraits.
- A warm, slightly faded grade with sunset light leaks.
- Brush-script titles that paint in on the beat, under small chapter kickers.
- An opening that introduces everyone by name, and an "Until next summer" ending.

Every cut lands on a bar of the music. The skill was distilled from a real family film
(Hurghada, 2026) that went through several rounds of design review.

## What it asks you

1. How many people are in the photos, each person's **name**, and how to recognise
   them ("dad, navy tee", "younger daughter, red bow").
2. The **photo folder**.
3. The **music** file (mp3, wav, m4a…). Videos run up to 3 minutes; longer tracks fade
   out.
4. The **place** and **year** for the titles.
5. **Formats**: 16:9, 9:16, or both.

Then it picks and orders the photos, writes the chapters and titles, renders, checks
stills for bad crops or titles on faces, fixes them, and does the final render. You
don't have to touch any code.

## Example

> Make a family video from the photos in `D:\Photos\Crete 2027` with `D:\Music\summer.mp3`.
> It's the five of us: Anna, Pavel, and the kids Sofia, Max and Lea.

Output, in `<project>/slideshow/out/`:

```
Crete-2027-family-slideshow.mp4   16:9
Crete-2027-reels-9x16.mp4         9:16 for Instagram Reels
Crete-2027-reels-cover.jpg        pick this as the Reel cover in the Instagram app
```

The project also contains `SCENARIO.md`, a readable plan of every slide, its photos
and its titles, plus the photos that were skipped as near-duplicates.

## Requirements

- **Windows, macOS or Linux**
- **Claude Code**: the Claude Desktop app's **Code** tab, the `claude` terminal app, or
  an IDE extension. Claude Code needs a paid Claude plan (Pro or higher).
- **Node.js 18+**, the LTS version from [nodejs.org](https://nodejs.org)
- **Git**: on Windows, [Git for Windows](https://git-scm.com/download/win) is required
  by Claude Code itself and is used to install the skill. macOS includes git (it
  installs the Command Line Tools on first use).
- Internet access on the first run (npm packages, Remotion's headless browser
  ~170 MB, and the HyperFrames CLI via `npx`)
- About 1.5 GB of free disk space per project

You don't need Python, Chrome or ffmpeg. Remotion, HyperFrames, `sharp` and an ffmpeg
build are installed into each project.

## Install

**Option 1: the skills CLI (recommended).** It installs into Claude Code for you:

```bash
npx skills add bullder/family-trip-slideshow -g -a claude-code
```

Drop `-g` to install into the current project only, and `-a claude-code` to choose
agents interactively. To update later, run the same command again.

**Option 2: git clone** straight into your skills folder:

```bash
# macOS / Linux
git clone https://github.com/bullder/family-trip-slideshow.git ~/.claude/skills/family-trip-slideshow
```

```powershell
# Windows (PowerShell)
git clone https://github.com/bullder/family-trip-slideshow.git "$env:USERPROFILE\.claude\skills\family-trip-slideshow"
```

Update with `git pull` in that folder.

**Option 3: download the ZIP** from GitHub (Code › Download ZIP). Unzip it and rename
the folder to `family-trip-slideshow` inside `~/.claude/skills/` (or
`%USERPROFILE%\.claude\skills\` on Windows).

Then start a new Claude Code session (terminal, IDE, or the Claude Desktop **Code**
tab; see below). The skill triggers whenever you ask for a
slideshow, photo montage, travel video or Reel from your own photos. You can also run
it directly with `/family-trip-slideshow`.

### Claude Desktop

The Claude Desktop app (macOS and Windows) has two places where skills run, and this
skill fits one of them much better than the other.

**Code tab, recommended.** The desktop app's **Code** tab is Claude Code. It reads the
same skills folder as the terminal and runs on your own computer, so it can read your
photo folder, install packages and render video.

New to this on Windows? The [beginner guide](docs/WINDOWS.md) walks through installing
Claude Desktop, Node.js and Git, step by step.

1. Install [Claude Desktop](https://claude.ai/download), Node.js 18+ and Git (see
   Requirements), then install the skill with Option 1 or Option 2 above. It lands in
   `~/.claude/skills/` (or `%USERPROFILE%\.claude\skills\` on Windows).
2. Open Claude Desktop, switch to the **Code** tab, and start a session in any folder
   (your home folder is fine).
3. Ask for your video, e.g. *"Make a family slideshow from the photos in
   ~/Pictures/Crete 2027 with ~/Music/summer.mp3"*. Approve the commands it asks to
   run: npm install, rendering, and so on.

**Chat with an uploaded skill: not recommended for this skill.** You can upload skills
to regular chats under **Settings › Capabilities › Skills › Upload skill**: zip this
folder, or use GitHub's *Download ZIP*, then turn on code execution. But chat skills
run in a cloud sandbox, not on your computer. The sandbox can't see your photo folder,
usually can't run `npm install` or download the headless browser, and isn't built for
multi-minute video renders. Expect it to stop at the planning stage (choosing photos
and writing `story.json`) at best. Use the Code tab for real renders.

## How it works

| Step | Tool (run from `<project>/slideshow`) | What it does |
|---|---|---|
| Setup | `node <skill>/scripts/setup.mjs <project> <music>` | copies the template, installs dependencies, fetches the headless browser |
| Photos | `node tools/prepare-photos.mjs <folder>` | 2400px EXIF-rotated JPEGs, labelled contact sheets, `review/photos.json` |
| Music | `node tools/beats.mjs` | beat detection (`hyperframes beats`), the bar grid, intro/outro bars, energy surges |
| Story | *(Claude writes `src/story.json`)* | photo choice, chapters, titles, crops, and a 9:16 layout per slide |
| Check | `node tools/validate.mjs` · `node tools/scenario.mjs` | timeline tiling, missing photos, title widths; writes `SCENARIO.md` |
| Cards | `node tools/build-cards.mjs` | renders the four HyperFrames title cards (intro and outro × 16:9 and 9:16) |
| Review | `node tools/stills.mjs <Slideshow\|SlideshowVertical> <dir> [--guides]` | still sheets; `--guides` tints Instagram's UI zones |
| Render | `node tools/render.mjs <Name> both` | final MP4s and the Reel cover |

Everything that differs between trips lives in one file, `slideshow/src/story.json`.
`references/story-format.md` documents it, and `references/example-story.json` is the
complete Hurghada film.

## Tweaking a finished video

Open the project in Remotion Studio to scrub through it, then ask Claude for changes
in plain words ("swap the photo on the pool slide", "shorter title for Eva"):

```bash
cd <project>/slideshow
npx remotion studio
```

## Folder layout

```
family-trip-slideshow/
├── SKILL.md                  instructions Claude follows
├── README.md                 this file
├── docs/WINDOWS.md           beginner setup guide for Windows
├── scripts/setup.mjs         creates a project (Node built-ins only)
├── references/
│   ├── craft.md              story shape, title voice, crop and safe-zone rules
│   ├── story-format.md       story.json schema
│   └── example-story.json    the reference film
└── assets/template/          copied into each project as <project>/slideshow
    ├── src/                  Remotion compositions (Slideshow, SlideshowVertical)
    ├── tools/                the Node tools above + HyperFrames card templates
    └── public/fonts/         Kaushan Script, Manrope (SIL Open Font License)
```

## Troubleshooting

- **The first stills or render run is slow.** Remotion downloads its headless browser
  once. `setup.mjs` does this up front; if it was skipped, the first run takes a few
  extra minutes.
- **HEIC photos skipped (Windows/Linux).** Export them as JPEG first. On iPhone,
  Settings › Camera › Formats › *Most Compatible* avoids HEIC. On macOS they convert
  automatically.
- **A name is on the wrong person.** Tell Claude who is who ("Lea is the one in the
  yellow dress"). It updates the titles and re-renders.
- **The music is longer than 3 minutes.** The video caps at 3:00 and fades the music.
  Ask for a different length if you want one.
- **Windows support** is built in (Windows binaries in the lockfile, ffmpeg from
  Remotion's bundle, shell-safe `npx` calls) but has only been tested on macOS so far.
  Please report the error text if a step fails on Windows.

## Credits and licences

- Built with [Remotion](https://www.remotion.dev) and
  [HyperFrames](https://hyperframes.heygen.com). Remotion is free for individuals and
  small teams; check its licence for company use.
- Fonts: Kaushan Script and Manrope, both under the SIL Open Font License. The
  licence texts are in `assets/template/public/fonts/`.
- You're responsible for the rights to the music you use, especially for public posts
  on Instagram.
