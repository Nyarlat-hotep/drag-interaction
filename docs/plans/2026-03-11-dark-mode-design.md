# Dark Mode Toggle — Design

## Overview

Add a light/dark mode toggle to the drag-interaction app, matching the pattern used in the condition-builder project. Dark mode is the default.

## Approach

CSS custom properties on `:root` (dark default) with `:root[data-theme="light"]` overrides. Theme state lives in `App.jsx`, applied via `useEffect` to `document.documentElement.dataset.theme`. No localStorage — resets to dark on refresh.

## Toggle Button

- Positioned absolutely in the top-right corner of the left `.app` card
- Sun icon when in dark mode (click → light), moon icon when in light mode (click → dark)
- Same SVG icon style as condition-builder

## CSS Variables

Defined in `index.css`:

| Variable | Dark | Light |
|---|---|---|
| `--bg-body` | `#0f1117` | `#f0f0f0` |
| `--bg-surface` | `#1a1d2e` | `#ffffff` |
| `--fg-primary` | `#e8e8f0` | `#111111` |
| `--fg-muted` | `#888898` | `#666666` |
| `--border-subtle` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |
| `--pill-empty` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.07)` |
| `--pill-border` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.12)` |

## Files Changed

- `src/index.css` — add CSS variables, replace hardcoded body/root colors
- `src/App.css` — replace hardcoded colors with variables
- `src/App.jsx` — add theme state, useEffect, toggle button
- `src/components/Pill.css` — replace hardcoded pill colors with variables
- `src/components/UsageGrid.css` — replace any hardcoded colors
- `src/components/WeeklyTotal.css` — replace any hardcoded colors
- `src/components/TabBar.css` — replace any hardcoded colors
- `src/components/PhysicsContainer.css` — replace any hardcoded colors

## What Stays Hardcoded

App accent colors (YouTube red, TikTok pink, etc.) come from `data.js` and are always preserved — they should not be themed.
