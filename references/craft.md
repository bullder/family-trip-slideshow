# Craft notes

What made the Hurghada film work, and the mistakes that cost review rounds. Read this
before writing story.json.

## Story shape

- **Bookends.** Open on a photo where everyone stands side by side, ideally holding
  hands, and close on another group shot (a sunset silhouette is perfect). The opening
  title slide is "The four of us" (use the real number of people in words: "The three
  of us", "The five of us"). The last slide before the outro is "Together, always", and
  the outro reads "Until next summer".
- **Chapters follow the settings** in shooting order: garden → lawn → pool → beach →
  sunset. Each chapter opens with a kicker "Chapter one · The garden" and a short brush
  title ("Lazy afternoons", "Blue o'clock", "Red Sea evenings"). Name the setting the way
  a family would.
- **Everyone gets a moment.** Give each person at least one solo slide with their name
  as the kicker and a warm 2–3 word phrase drawn from the photo: "Dreaming in red" (red
  bow), "Cool as ever" (black tee, relaxed pose), "In full bloom" (among flowers). Give
  couples and siblings a pair slide ("Mike & Mary / Still the best team", "Irina & Eva /
  Sisters", "Mom & her girls").
- **Wit from the picture itself:** "Egyptian engineering / Our own pyramid" for a
  stacked family pose. Look for one such line per film, without forcing it.
- Title roughly 60% of slides; let the rest breathe untitled.
- **Write fresh lines for every trip.** The examples here and in
  `example-story.json` show the voice; they are not a phrase bank. A title only works
  if it comes from what is in this family's photos.
- Keep English unless the user asks otherwise, and keep copy short: brush titles of
  1–4 words, kickers of 1–4 words.

## Picking photos

- Use `panels` for single-person or two-person portraits. A portrait of three or more
  people gets cropped at the panel edges (someone's arm or face falls off). Give group
  portraits a 2-panel slide, a `framed` slide, or a 9:16-only `full`.

- Skip near-duplicates: same people, same pose, same spot. Keep the stronger
  expression and composition. Note the skipped files in SCENARIO.md.
- Aim for about one photo per bar overall. Most slides are 2 bars. Group 2–3 portraits
  of the same moment into `panels`.
- Order by file name or shooting order inside a chapter. Move the most emotional shots
  (sunset, silhouettes, a kiss) to the end even if they were shot earlier.
- If you can't tell two people apart (for example, two sisters), ask the user once with
  a specific question, e.g. "Is Eva the one in the black tee?", rather than guessing.

## Pacing on the bar grid

- Put chapter openers and the emotional peak on the surge bars that `tools/beats.mjs`
  prints.
- Break the metronome before the climax. Split one or two 2-bar slides into two 1-bar
  slides joined by a hard cut (`"in": "cut"`) so the cuts quicken into the finale. Fade
  (inT 20–24) into the golden-hour shot.
- Every slide's bars must tile from `introEndBar` to `outroStartBar` with no gaps.
  `tools/validate.mjs` checks this.

## Grade

- The base grade is warm and slightly faded (theme.ts). Set `"grade": "lush"` on
  saturated garden or lawn chapters and `"azure"` on pool or electric-blue sky chapters,
  so the film reads as one place.
- Fix a single slide that still jumps (magenta skin, pure-blue sky) with a one-off
  `filter`: warmer and less saturated, e.g. `"saturate(0.78) sepia(0.12) brightness(0.97)"`.
  For washed-out skin, use `"saturate(1.12) contrast(1.06)"`.

## Title placement

- Never put a title on a face, head, hands or a busy floral print. This was the most
  common slip in every test, so look at each titled still and ask: does any letter touch
  a head? Pick the corner with
  sky, foliage, wall or grass. Check every titled slide on the stills sheets, because the
  first guess often lands on someone's head.
- Over pale sky, add `"scrim": 1.6`.
- On framed slides the title sits on the field opposite the print. Size it up (140–190)
  so the field doesn't feel empty.

## 9:16 specifics

- Instagram Reels UI covers the top ~220px, the bottom ~420px (caption, audio,
  buttons) and a right-hand action column ~150px wide in the lower half. Keep faces and
  text out of those zones, and keep text lines under ~860px wide. Re-break long titles
  with `\n` in `vertical.title.text`.
- Turn group landscapes into `pan`, so each person passes the centre. Portraits become
  `full`, and panels become `seq` cut on the beat.
- When a `seq` title names only the people in the first shot ("Mom & her girls", but
  shot 2 is just the girls), set `titleOnFirst`.
- The last slide uses `band` with the outro photo, and its title sits at `v-band`, so
  the outro's "Until next summer" lands in the same spot.

## Verification

Render stills of both compositions (`tools/stills.mjs`, add `--guides` for 9:16), look at
every sheet, and fix in one batch: crops (heads cut, faces in the action column),
titles on faces, and grade jumps. Re-check only the changed frames, then render. Two
rounds is usually enough.
