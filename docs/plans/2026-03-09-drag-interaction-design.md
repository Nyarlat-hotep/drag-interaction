# Drag Interaction — Design Doc
*2026-03-09*

## Overview

A single-page React experiment: "How much time do you spend?" Users drag across pill-shaped slots to paint their weekly screen time per app. Physics-driven dots pile up in a container at the bottom as hours accumulate.

## Apps (fixed)

| App | Color |
|---|---|
| Instagram | `#E1306C` |
| Facebook | `#1877F2` |
| TikTok | `#EE1D52` |
| X | `#555555` |
| YouTube | `#FF0000` |

## Data Model

```js
usage = {
  Instagram: { Mon: [0, 0, ...24], Tue: [...], ... },
  Facebook:  { ... },
  // ...
}
```

- 7 days (Mon–Sun), 24 slots per day
- Each slot value: `0` (empty), `0.5` (half / 30 min), `1` (full / 1 hour)
- Active tab filters which app's data the grid shows and edits
- State resets on page reload (no persistence)

## Components

```
App
├── TabBar            — 5 app tabs, active tab highlighted
├── UsageGrid         — 7 DayColumns side by side
│   └── DayColumn     — day label, 12 PillRows, daily total below
│       └── PillRow   — 2 Pills side by side (each = 1 hour)
│           └── Pill  — empty / half / full state, fills from bottom
├── WeeklyTotal       — total hours across all apps
└── PhysicsContainer  — Matter.js canvas + app legend
```

## Interaction

**Drag mechanic:**
- `mousedown` / `touchstart` on a pill begins a drag session
- Session paint mode is set by the first pill touched:
  - Was empty or half → filling session
  - Was full → clearing session
- As cursor/finger moves through pills, each pill's state is set based on cursor Y position within the pill:
  - Top 50% of pill height → half-fill (30 min)
  - Bottom 50% of pill height → full (1 hour)
- Clearing session sets pills back toward empty (full → half → empty as cursor passes through)
- `mouseup` / `touchend` ends the session
- Touch uses `document.elementFromPoint` to resolve pill under finger during `touchmove`

**Pill visual:**
- Fills from the bottom up
- Half-fill = bottom 50% of pill colored
- Full = entire pill colored
- Color = active app's color

## Physics Container (Matter.js)

**World setup:**
- Gravity pulling downward
- Three static walls: floor, left, right (no ceiling)
- Dots drop in from the top with slight random horizontal offset

**Dot lifecycle:**
- Empty → half: spawn 1 dot
- Half → full: spawn 1 more dot
- Full → half: remove 1 dot (most recently added of that app's color)
- Half → empty: remove 1 dot

**Body properties:**
- Shape: circle, small radius (~6px)
- `restitution: 0.4` (moderate bounce)
- `friction: 0.1`
- `frictionAir: 0.01`
- Custom color property for rendering

**Rendering:** Custom `afterRender` hook draws filled colored circles over Matter.js bodies.

**Legend:** Below canvas — colored dot + `AppName: Xh` for each app with time logged.

## Styling

- Light mode: `#f5f5f5` page background, white card surface
- Max-width ~700px, centered
- Pills: `#e0e0e0` empty, app color when filled
- Typography: system-ui, dark text
- No dark theme — this experiment is intentionally light

## Portfolio Card

New entry in `portfolio/src/components/Pages/Experiments.jsx`:

```js
{
  title: 'DRAG_INTERACTION',
  description: 'How much time do you spend? Drag across pills to paint your weekly screen time. Physics-driven dots pile up as the hours grow.',
  tags: ['Interaction', 'Physics', 'Data Viz'],
  link: 'https://nyarlat-hotep.github.io/drag-interaction/',
  status: 'OPERATIONAL',
}
```

## Out of Scope

- Data persistence
- User-configurable apps
- Mobile-optimized layout (touch works but layout targets desktop)
