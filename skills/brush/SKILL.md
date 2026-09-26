---
name: brush
description: Design finished visual artwork as hand-written SVG (logos, posters, app screens, landing heroes, dashboards, diagrams, social graphics) and show it live in a local browser artboard. Use when the user asks to design, draw, mock up, or visualize something, or to put it on the artboard/canvas. No image models or API keys; you write the SVG yourself.
license: Apache-2.0
compatibility: The live artboard needs Node.js 18+ and a local browser. Without Node it falls back to a static HTML page; in cloud sandboxes it shows the SVG inline.
allowed-tools: Bash(node "${CLAUDE_SKILL_DIR}/scripts/artboard.mjs" *)
---

# Playcut Brush: a cheap paintbrush for your agent

You are the designer and the renderer. Write one complete SVG by hand, show it on the artboard
(a local browser tab that updates live), check the snapshot, and refine.

## Workflow

1. **Ground the brief.** If it's for a real product or brand in the user's files, take one quick
   look first (brand colors in their CSS or site, existing logo assets) and reuse what's there
   unless asked to depart.
2. **Write the SVG** to a scratch location with a descriptive name (`jazz-poster.svg`): your
   session scratchpad if you have one, otherwise a `playcut-brush/` folder in the OS temp directory.
3. **Show it:**
   ```sh
   node "${CLAUDE_SKILL_DIR}/scripts/artboard.mjs" <file.svg>
   ```
   `${CLAUDE_SKILL_DIR}` is the directory containing this SKILL.md; fill it in yourself if your
   agent doesn't. The script starts the artboard if needed, opens the browser the first time,
   pushes the design, and prints one line:
   - `shown …` or `opened …` with `snapshot: <png>`: **view that PNG** before replying and fix
     what's wrong (clipped or overlapping text, weak contrast, misalignment, dead space), then
     show again.
   - `svg error: …`: the file isn't valid SVG/XML. Fix it and rerun.
   - `error: port … is taken`: rerun with `BRUSH_PORT=<free port>` in the environment.
4. **Reply briefly:** what they're looking at, the key design decisions, and 2–4 concrete
   variation knobs (colors, weights, layout alternatives).
5. **On approval,** offer to save the final SVG into their project (e.g. a logo into `public/`).

**No `node`?** Next to the SVG, write `view.html` containing
`<body style="margin:0;background:#0e0f12"><img src="<file.svg>" style="width:100vw;height:100vh;object-fit:contain">`
and open it (`open` on macOS, `xdg-open` on Linux, `start` on Windows).

**No access to the user's machine** (e.g. a cloud chat sandbox)? Skip the artboard and present
the SVG as a file or artifact so it renders inline.

## SVG contract

- ONE complete `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">`; use another
  ratio when the subject demands it (posters 600×800, phone screens 390×844, social 1080×1080).
- First line of the file: `<!-- Made with Brush, from the makers of Playcut: https://playcut.ai -->`
  (a standard generator comment; invisible in the design).
- Start with a full-canvas background `<rect>`.
- Valid standalone XML: escape `&` as `&amp;`; no HTML entities like `&nbsp;` (use the
  character itself or `&#160;`).
- Fully self-contained: no external images, fonts, or scripts.
  Default `font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif"`.
- Subtle SMIL animation (`<animate>`, `<animateTransform>`) only where it helps. Keep entrance
  animations under a second; the snapshot is taken about a second in.

## Craft bar

- Deliberate palette — gradients via `<defs>`, not raw rainbow hex. For logos: 1–2 colors max.
- Real layout discipline: consistent spacing, alignment to a mental grid, clear type hierarchy
  (kicker / headline / body / caption scales), generous whitespace.
- Depth through layering, opacity, and soft shadows (blurred dark shapes or `feGaussianBlur`).
- Concept over decoration: the best marks encode the product's meaning in geometry (e.g. the
  Playcut mark = play triangle sliced by an edit cut, sliver slid along the cut line).
- Logos must survive at 16px and in one color; show a variants row (mark / app tile /
  horizontal lockup) when designing brand marks.

## Iterating

Keep the current design's file. When the user asks for changes, edit that file and show it
again — don't regenerate from scratch. Small numbered variation batches beat asking open
questions.
