![Playcut Brush: give your agent a paintbrush](https://raw.githubusercontent.com/mehrang0/playcut-brush/main/.github/media/banner.png)

# Playcut Brush

**Give your agent a paintbrush.** Ask your coding agent for a poster, a logo, an app screen, or a
dashboard. It designs it as SVG, and you watch it appear live in a browser tab.

No API keys, no image models, no extra account. It runs on the plan you already have: Claude
Code on a Claude plan, Codex on a ChatGPT plan. Free and open source, from the makers of
[Playcut](https://playcut.ai).

## Install

**Claude Code**

```sh
/plugin marketplace add mehrang0/playcut-brush
/plugin install brush@playcut
```

**Codex, Cursor, Gemini CLI, and other [Agent Skills](https://agentskills.io) agents:** copy the
skill folder into your agent's skills directory. For Codex:

```sh
git clone --depth 1 https://github.com/mehrang0/playcut-brush /tmp/playcut-brush
mkdir -p ~/.agents/skills && cp -R /tmp/playcut-brush/plugins/brush/skills/brush ~/.agents/skills/brush
```

Needs [Node.js](https://nodejs.org) 18+ for the live browser tab. Without Node, Brush still works
and opens each design as a static page.

## See it

![Brush designing a poster, a logo, an app screen, a dashboard, and a banner, live](https://raw.githubusercontent.com/mehrang0/playcut-brush/main/.github/media/demo.gif)

Just ask:

- "design a poster for a jazz night on Friday"
- "design a logo for a coffee roaster called Ember, with app icon variants"
- "design a mobile banking app home screen"
- "design a sales dashboard for Northwind"
- then refine: "make it purple", "bigger headline", "try three layouts"

The first design opens a browser tab. After that, every change updates the same tab. The designs
in the demo are in [`examples/`](https://github.com/mehrang0/playcut-brush/tree/main/examples), all made with Brush.

## How it works

```
you: "design a poster"
  → your agent writes poster.svg
  → Brush's local server (127.0.0.1:2673) pushes it to the browser tab
  → the tab sends a snapshot back, so the agent checks its own work and fixes
    clipped text, overlaps, or weak contrast before it replies
```

Language models already speak SVG fluently. It's text, so they write it as easily as code, and
it comes out crisp at any size, with real typography, precise layout, and even subtle animation.
No image generation needed.

### What it runs

Brush is one skill plus one small script with no dependencies. To show a design, your agent runs
`node scripts/artboard.mjs <file.svg>`, which:

- starts a local server on `127.0.0.1:2673` (your machine only; set `BRUSH_PORT` to change the
  port) and opens your default browser the first time
- serves the artboard page and pushes each design to it
- saves the tab's snapshot as a PNG in your temp folder (`playcut-brush/`) so the agent can check
  its work
- shuts itself down after 30 idle minutes with no tab open

It makes no other network requests and collects nothing.

## FAQ

**Does it cost anything?** Brush is free. Designing uses your agent's normal usage on your
existing plan.

**Is anything sent anywhere?** Brush's server only listens on your own machine, turns away
requests from other websites, and collects nothing. Your agent talks to its provider as usual.

**Where do my designs go?** Your agent saves them as `.svg` files. Ask it to put the final one in
your project (for example a logo in `public/`). The designs are yours to use however you like.

**Does it work in the Claude app's chat?** Chat runs skills in the cloud, where they can't open a
tab on your computer, so there the design shows up in the chat instead. The live tab needs a
local agent like Claude Code or Codex.

## Contributing

Issues and pull requests are welcome. Contributions are accepted under the same license.

## License

[Apache-2.0](https://github.com/mehrang0/playcut-brush/blob/main/LICENSE) © Mehran G: free to use, modify, and ship, commercially too. If you share or
fork it, keep the [NOTICE](https://github.com/mehrang0/playcut-brush/blob/main/NOTICE) file, which credits Playcut.

"Brush" is Mehran G's project name and "Playcut" is a trademark of BLOX LABS INC; the license
doesn't cover them. If you fork it, give your version a different name.
