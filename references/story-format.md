# story.json format

`slideshow/src/story.json` is the only file that changes between trips.

**Photo ids** are the file stems that `tools/prepare-photos.mjs` wrote to
`review/photos.json` (`TAHA0311.JPG` becomes `"TAHA0311"`). The example's short ids
(`"0311"`) come from its own project; don't copy them. Both
Remotion compositions and `tools/build-cards.mjs` read it. A complete, approved example
(Hurghada 2026, four people, 24 slides, 2:00) is in `example-story.json` next to this
file. Copy its patterns rather than inventing new structures.

## Top level

```jsonc
{
  "meta": {
    "place": "Hurghada",                  // the opening title, and the default outro kicker
    "year": "2026",                       // shown as digits under the title
    "people": [                           // order = the order of the names line on both cards
      { "name": "Mike", "who": "dad, navy tee" }
    ]
  },
  "timing": {                             // from tools/beats.mjs → review/music.json
    "introEndBar": 3,                     // first slide starts on this bar
    "outroStartBar": 45,                  // the outro card starts here
    "totalSeconds": 120                   // video length (≤ music length)
  },
  "intro": {
    "photo": "0473",                      // everyone side by side, landscape, ideally linked hands
    "focus": "50% 62%",                   // CSS object-position for the 16:9 crop
    "kicker": "A family story",
    "chain": [                            // 9:16 opening walks this photo LEFT→RIGHT, naming each
      { "name": "Eva", "x": 0.20 }        // x = centre of that person as a fraction of photo width
    ]
  },
  "outro": {
    "photo": "0456",                      // landscape group shot; sunset/silhouette is ideal
    "kicker": "Hurghada · Red Sea · 2026",
    "title": "Until next summer"
    // "band": { "top": "#…", "bottom": "#…" }  ← written by tools/build-cards.mjs
  },
  "slides": [ /* see below */ ]
}
```

The `chain` lists people in the order they stand in the intro photo, left to right.
That order is not necessarily the `people` order. Every person must appear exactly
once.

## A slide

```jsonc
{
  "name": "Mike & Mary",                  // unique; shown in Remotion Studio's timeline
  "kind": "panels",                       // "single" | "panels" | "framed"
  "bars": [9, 11],                        // [start, end) on the bar grid; slides tile with no gaps
  "in": "tiltL",                          // transition INTO this slide (see below)
  "inT": 18,                              // its length in frames (12–24; 0 or "cut" = hard cut)
  "grade": "lush",                        // optional chapter look: "lush" | "azure"
  "filter": "saturate(1.12) contrast(1.06)", // optional one-off CSS filter (replaces grade)
  "leak": true,                           // sunset light leak sweeping in
  "side": "right",                        // framed only: which side the print sits on
  "field": "#24361c",                     // framed only: flat colour behind the print
  "title": {
    "kicker": "Mike & Mary",              // small tracked caps with a coral rule (optional)
    "text": "Still the best team",        // brush title; one line in 16:9
    "at": "bottom-right",                 // 16:9 placement
    "size": 128,                          // px; 120–170 typical
    "style": "stroke",                    // "stroke" on chapter openers (longer leak)
    "scrim": 1.6                          // stronger dark backing over pale sky
  },
  "shots": [                              // 1 for single/framed, 2–3 for panels
    { "photo": "0279", "focus": "50% 22%", "move": { "zoom": [1.14, 1.04] } }
  ],
  "vertical": { /* 9:16 re-composition, below */ }
}
```

### Kinds (16:9)
| kind | use for | notes |
|---|---|---|
| `single` | landscape photos | full bleed, Ken Burns. `focus` = object-position; `move.zoom` = [start, end] scale; `move.pan` = [[x,y],[x,y]] in % translate |
| `panels` | 2–3 portraits of the same moment | slanted side-by-side panels; focus `"50% 25%"` keeps heads in |
| `framed` | one strong portrait | print on a flat colour field; put the title on the other `side` |

### Transitions
`fade`, `slantR`, `slantL` (leaning panel sweeps in), `tiltL`, `tiltR` (frame swings
in rotated, best for chapter openers), `push` (punch-in with a cream flash), `cut`
(hard cut on the downbeat). Within a chapter, alternate `slantR` and `slantL`. Open
chapters with `tiltL`/`tiltR`, and fade into the emotional finale.

### Placements
16:9: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `bottom-center`, `left`,
`right`, `center`.
9:16: `v-top` (250px from the top), `v-low` (470px from the bottom), `v-band` (under
the outro band, matching the outro card's title position).

## vertical (9:16)

```jsonc
"vertical": {
  "layout": { "kind": "pan", "photo": "0311", "from": 10, "to": 90, "y": 40 },
  "title": { "at": "v-top", "size": 120, "kickerSize": 30, "text": "optional\nre-break" },
  "titleOnFirst": true                    // seq only: title lives on the first shot
}
```

| layout | fields | use for |
|---|---|---|
| `full` | `photo`, `focus` | a portrait filling the frame |
| `pan` | `photo`, `from`, `to`, `y` | a landscape: `from`/`to` are object-position x % over the slide |
| `seq` | `shots[]` {`photo`,`focus`,`zoom?`,`shift?`} | panels become full-screen portraits cut in sequence |
| `band` | `photo` | the last slide (same photo as the outro), so the ending swaps in place |

A vertical layout may use a different photo from the 16:9 shot. For example, use a
tighter portrait twin for 9:16 when the 16:9 pick is a wide landscape. The last
slide and the outro deliberately share one photo: the final line then replaces
"Together, always" in the same spot.

`pan` x maths: the photo fills the frame height, so only the x position moves. A
higher % shows more of the photo's right side. To bring a person who sits on the right
toward the centre, raise the number. Aim for face centres at x ≈ 420–640 of 1080.

In a 9:16 `full` or `seq` shot, a 2:3 portrait fills the frame height, so a focus
**y** does nothing either. Pick the title placement by where the bodies aren't:
`v-top` when heads sit low or there's sky or foliage on top, `v-low` when the lower
third is grass or ground. Use `zoom` with a focus origin to push the crop.

Portraits barely move with an x focus, because a 2:3 photo in 9:16 has almost no
horizontal overflow. To recentre one, use `zoom` (e.g. `[1.3, 1.22]`) plus `shift`
(translate %, e.g. `-24` moves the image left, so a person on the right comes toward
the centre).
