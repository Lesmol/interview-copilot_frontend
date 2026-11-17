# Design reference

These files are the UI designs for the four screens. Each `*.dc.html` file is a single-screen mock-up in a custom design-canvas template format (`<x-dc>` markup plus a small `Component` class with `renderVals()` for sample state). They are **reference for layout, copy, colours, type and behaviour**, not production code. Do not copy the template format into the app; rebuild each screen as React components.

| File | Screen | Notes |
| --- | --- | --- |
| `Setup.dc.html` | Set up the interview | Interactive: In person / Remote call control, suggestion-type toggles, frequency, consent checkbox enabling Start. |
| `Main.dc.html` | Live interview (desktop) | Interactive: transcript with underlined phrases, speaker-name swap toggle, suggestion cards (Asked / Pin / Dismiss), questions list. |
| `Phone.dc.html` | Live interview (phone, 390×844) | Static. |
| `Review.dc.html` | Review after the interview | Static: filter row, flagged moments, notes, "Worth following up". |
| `canvas.json` | Board positions | Not needed for the build. |

Tokens seen in the designs: dark background `#111315`, text `#EDEBE6`, muted `#8B929A` / `#A7ADB4`, borders `#23272B` / `#3A4046`, accent amber `#E8A33D`, live red `#FF6B5E`, teal `#5CC8B8`. Fonts: Inter (UI) and Newsreader (transcript and suggestion text).

Not designed yet (build to the brief): the "Who is taking part?" participant list on Setup, and the full speaker-label menu (rename, role, merge, swap). The Main screen only has a simple swap toggle.

The interview text, names and timestamps are placeholder data.
