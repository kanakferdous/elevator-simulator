# Elevator Simulator

A tiny, vanilla **HTML/CSS/JS** elevator that feels alive: instant destination
highlight, **900ms per-floor** motion, SVG direction arrows, and synchronized
**hall + car** doors. Built as a fun UI project—no frameworks, just vibes.

<p align="center">
  <!-- Replace with your own GIF/screenshot or remove this block -->
  <img src="docs/demo.gif" alt="Elevator Simulator demo" width="640">
</p>

## Features
- **Pure HTML/CSS/JS** — zero dependencies.
- **Compact panel** layout: `5 • 4 • 3` / `2 • 1` / `G · Open · Close`.
- **Instant selection** — clicked floor lights up immediately.
- **Fixed speed** — 900ms travel per floor, ticks each level as it moves.
- **Door sync** — landing (hall) doors mirror the car doors on arrival.
- **Direction icons** — clean SVG ▲ / ▼ in-cab + header indicators.
- **Smart states** — current floor auto-disabled; buttons lock while moving.
- **CSS variables** drive timing & sizing; JS reads them to stay in sync.

## Quick start
```bash
# Option 1: open the file directly
open index.html   # or double-click in Finder

## Project files

```text
index.html   # scene + control panel markup
style.css    # layout, doors, labels, panel, animations
main.js      # state, movement, doors, indicators, controls