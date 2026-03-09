# Drag Interaction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a light-mode single-page React app where users drag across pill slots to log weekly screen time per app, with Matter.js physics dots accumulating in a container at the bottom.

**Architecture:** All state lives in `App.jsx` as a `usage` object keyed by app→day→array of 24 slot values (0, 0.5, 1). The active tab filters which app's data the grid shows. A ref-tracked drag session handles mouse/touch fill painting. Matter.js runs headlessly (engine + world only, no built-in renderer) — a `requestAnimationFrame` loop draws colored circles on a `<canvas>` manually.

**Tech Stack:** React 18, Vite, Matter.js, framer-motion (already installed), plain CSS (light mode)

**Design doc:** `docs/plans/2026-03-09-drag-interaction-design.md`

---

## Task 1: Install Matter.js + update CSS to light mode

**Files:**
- Modify: `package.json`
- Modify: `src/index.css`
- Modify: `src/App.css`
- Modify: `src/App.jsx`

**Step 1: Install Matter.js**

```bash
cd /Users/taylorcornelius/Desktop/drag-interaction
npm install matter-js
```

**Step 2: Replace `src/index.css` entirely**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f0f0f0;
  color: #111;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

#root {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem 4rem;
}

button { font-family: inherit; cursor: pointer; border: none; background: none; }
```

**Step 3: Replace `src/App.css` entirely**

```css
.app {
  background: #fff;
  border-radius: 20px;
  padding: 2rem 2rem 2.5rem;
  width: 100%;
  max-width: 720px;
  box-shadow: 0 2px 24px rgba(0,0,0,0.08);
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #111;
}

.app-subtitle {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 1.75rem;
}
```

**Step 4: Replace `src/App.jsx` with minimal shell**

```jsx
import './App.css'

export default function App() {
  return (
    <div className="app">
      <h1 className="app-title">How much time do you spend?</h1>
      <p className="app-subtitle">
        Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
      </p>
    </div>
  )
}
```

**Step 5: Run dev server and verify light card renders**

```bash
npm run dev
```

Expected: white card centered on gray background with title and subtitle visible.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: light mode shell + install matter-js"
```

---

## Task 2: Data model + TabBar

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/TabBar.jsx`
- Create: `src/components/TabBar.css`

**Step 1: Define constants in a new file `src/data.js`**

```js
export const APPS = [
  { name: 'Instagram', color: '#E1306C' },
  { name: 'Facebook',  color: '#1877F2' },
  { name: 'TikTok',    color: '#EE1D52' },
  { name: 'X',         color: '#555555' },
  { name: 'YouTube',   color: '#FF0000' },
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SLOTS_PER_DAY = 24 // 12 rows × 2 pills, each pill = 1 hour (0 | 0.5 | 1)

export function makeEmptyUsage() {
  const usage = {}
  for (const app of APPS) {
    usage[app.name] = {}
    for (const day of DAYS) {
      usage[app.name][day] = new Array(SLOTS_PER_DAY).fill(0)
    }
  }
  return usage
}
```

**Step 2: Create `src/components/TabBar.jsx`**

```jsx
import './TabBar.css'
import { APPS } from '../data'

export default function TabBar({ activeApp, onSelect }) {
  return (
    <div className="tab-bar">
      {APPS.map((app) => (
        <button
          key={app.name}
          className={`tab ${activeApp === app.name ? 'tab--active' : ''}`}
          onClick={() => onSelect(app.name)}
          style={activeApp === app.name ? { borderColor: app.color } : {}}
        >
          {app.name}
        </button>
      ))}
    </div>
  )
}
```

**Step 3: Create `src/components/TabBar.css`**

```css
.tab-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 999px;
  width: fit-content;
}

.tab {
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #444;
  background: transparent;
  border: 2px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.tab--active {
  background: #fff;
  color: #111;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
```

**Step 4: Wire into `App.jsx`**

```jsx
import { useState } from 'react'
import { APPS, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import './App.css'

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)

  return (
    <div className="app">
      <h1 className="app-title">How much time do you spend?</h1>
      <p className="app-subtitle">
        Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
      </p>
      <TabBar activeApp={activeApp} onSelect={setActiveApp} />
    </div>
  )
}
```

**Step 5: Verify tabs render and switch active state visually**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: data model + TabBar"
```

---

## Task 3: Pill component

**Files:**
- Create: `src/components/Pill.jsx`
- Create: `src/components/Pill.css`

**Step 1: Create `src/components/Pill.jsx`**

The pill has 3 fill states: `0` (empty), `0.5` (half), `1` (full). It fills from the bottom up. The `data-slot` and `data-day` attributes are used by the drag handler to identify which pill is being touched.

```jsx
import './Pill.css'

export default function Pill({ value, color, slotIndex, day, onPointerEnter, onPointerDown }) {
  const fillPct = value === 1 ? '100%' : value === 0.5 ? '50%' : '0%'

  return (
    <div
      className="pill"
      data-slot={slotIndex}
      data-day={day}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
    >
      <div
        className="pill-fill"
        style={{ height: fillPct, backgroundColor: color }}
      />
    </div>
  )
}
```

**Step 2: Create `src/components/Pill.css`**

```css
.pill {
  position: relative;
  width: 22px;
  height: 42px;
  border-radius: 999px;
  background: #e4e4e4;
  overflow: hidden;
  flex-shrink: 0;
  touch-action: none;
  user-select: none;
}

.pill-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: 999px;
  transition: height 0.08s ease;
}
```

**Step 3: Verify pill renders in isolation by temporarily adding one to App.jsx**

Add `<Pill value={0.5} color="#E1306C" slotIndex={0} day="Mon" />` to App.jsx, confirm half-fill renders. Then remove the test render.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: Pill component with empty/half/full states"
```

---

## Task 4: UsageGrid, DayColumn, PillRow

**Files:**
- Create: `src/components/UsageGrid.jsx`
- Create: `src/components/UsageGrid.css`

**Step 1: Create `src/components/UsageGrid.jsx`**

12 rows × 2 pills per row = 24 slots per day. Slot index = `row * 2 + col`.

```jsx
import Pill from './Pill'
import './UsageGrid.css'
import { DAYS } from '../data'

function dailyTotal(slots) {
  return slots.reduce((sum, v) => sum + v * 0.5, 0) // each slot = 0.5h at full
}

// Wait — each pill = 1 hour (0.5 = 30min, 1 = 60min)
// dailyTotal: sum of all slot values in hours
function calcDayTotal(slots) {
  return slots.reduce((sum, v) => sum + v, 0)
}

function formatHours(h) {
  if (h === 0) return '0h'
  return h % 1 === 0 ? `${h}h` : `${h}h`
}

export default function UsageGrid({ usage, activeApp, activeColor, onSlotChange }) {
  return (
    <div className="usage-grid">
      {DAYS.map((day) => {
        const slots = usage[activeApp][day]
        const total = calcDayTotal(slots)
        return (
          <div key={day} className="day-col">
            <div className="day-label">{day}</div>
            <div className="pill-rows">
              {Array.from({ length: 12 }, (_, row) => (
                <div key={row} className="pill-row">
                  {[0, 1].map((col) => {
                    const slotIndex = row * 2 + col
                    return (
                      <Pill
                        key={col}
                        value={slots[slotIndex]}
                        color={activeColor}
                        slotIndex={slotIndex}
                        day={day}
                        onPointerDown={(e) => onSlotChange(e, day, slotIndex, 'down')}
                        onPointerEnter={(e) => onSlotChange(e, day, slotIndex, 'enter')}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="day-total">{formatHours(total)}</div>
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Create `src/components/UsageGrid.css`**

```css
.usage-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.day-label {
  font-size: 0.78rem;
  color: #888;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.pill-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pill-row {
  display: flex;
  gap: 5px;
}

.day-total {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.3rem;
}
```

**Step 3: Add to `App.jsx` with a stub `onSlotChange`**

```jsx
import UsageGrid from './components/UsageGrid'
import { APPS, makeEmptyUsage } from './data'

// In App, find active color:
const activeColor = APPS.find(a => a.name === activeApp)?.color ?? '#000'

// Add to JSX after TabBar:
<UsageGrid
  usage={usage}
  activeApp={activeApp}
  activeColor={activeColor}
  onSlotChange={() => {}}
/>
```

**Step 4: Verify grid renders — 7 columns, 12 rows of paired pills, day labels, all 0h totals**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: UsageGrid with DayColumn and PillRow layout"
```

---

## Task 5: Drag interaction

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add drag session refs and handler to `App.jsx`**

The drag session is tracked in a ref (not state) so it doesn't cause re-renders. The paint mode is set on first contact and held for the whole gesture.

```jsx
import { useState, useRef, useCallback } from 'react'
import { APPS, DAYS, makeEmptyUsage } from './data'

// Inside App():
const dragRef = useRef({ active: false, mode: null }) // mode: 'fill' | 'clear'

const getSlotValue = useCallback((day, slotIndex) => {
  return usage[activeApp][day][slotIndex]
}, [usage, activeApp])

// Determine new value for a pill given cursor Y position within the pill element
function computeFillValue(e, element) {
  const rect = element.getBoundingClientRect()
  const clientY = e.clientY ?? e.touches?.[0]?.clientY
  if (clientY == null) return 1
  const relY = (clientY - rect.top) / rect.height  // 0 = top, 1 = bottom
  // top half of pill → half fill, bottom half → full
  return relY < 0.5 ? 0.5 : 1
}

const applySlot = useCallback((day, slotIndex, newValue) => {
  setUsage(prev => {
    const next = { ...prev }
    const appData = { ...next[activeApp] }
    const daySlots = [...appData[day]]
    daySlots[slotIndex] = newValue
    appData[day] = daySlots
    next[activeApp] = appData
    return next
  })
}, [activeApp])

const handleSlotChange = useCallback((e, day, slotIndex, eventType) => {
  if (eventType === 'down') {
    e.preventDefault()
    const currentValue = usage[activeApp][day][slotIndex]
    // If slot is full, this gesture will clear; otherwise fill
    dragRef.current = {
      active: true,
      mode: currentValue === 1 ? 'clear' : 'fill',
    }
    if (dragRef.current.mode === 'fill') {
      const newVal = computeFillValue(e, e.currentTarget)
      applySlot(day, slotIndex, newVal)
    } else {
      // clear: full → half → empty cycle on each contact
      const nextVal = currentValue === 1 ? 0.5 : 0
      applySlot(day, slotIndex, nextVal)
    }
  }

  if (eventType === 'enter' && dragRef.current.active) {
    if (dragRef.current.mode === 'fill') {
      const newVal = computeFillValue(e, e.currentTarget)
      applySlot(day, slotIndex, newVal)
    } else {
      const currentValue = usage[activeApp][day][slotIndex]
      const nextVal = currentValue === 1 ? 0.5 : currentValue === 0.5 ? 0 : 0
      applySlot(day, slotIndex, nextVal)
    }
  }
}, [usage, activeApp, applySlot])
```

**Step 2: Add global pointerup listener to end drag session**

```jsx
useEffect(() => {
  const end = () => { dragRef.current.active = false }
  window.addEventListener('pointerup', end)
  return () => window.removeEventListener('pointerup', end)
}, [])
```

**Step 3: Wire touch support — add `onTouchMove` to `.app` div**

Touch `pointerenter` doesn't fire during scroll on mobile, so use `touchmove` with `elementFromPoint`:

```jsx
const handleTouchMove = useCallback((e) => {
  if (!dragRef.current.active) return
  const touch = e.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  if (!el) return
  const pill = el.closest('[data-slot]')
  if (!pill) return
  const slotIndex = Number(pill.dataset.slot)
  const day = pill.dataset.day
  // Synthetic event-like object for computeFillValue
  const synth = { clientY: touch.clientY, currentTarget: pill }
  if (dragRef.current.mode === 'fill') {
    const rect = pill.getBoundingClientRect()
    const relY = (touch.clientY - rect.top) / rect.height
    applySlot(day, slotIndex, relY < 0.5 ? 0.5 : 1)
  } else {
    const currentValue = usage[activeApp][day][slotIndex]
    applySlot(day, slotIndex, currentValue === 1 ? 0.5 : 0)
  }
}, [dragRef, usage, activeApp, applySlot])
```

Add `onTouchMove={handleTouchMove}` and `style={{ touchAction: 'none' }}` to the `.app` div.

**Step 4: Pass handler to UsageGrid**

```jsx
<UsageGrid
  usage={usage}
  activeApp={activeApp}
  activeColor={activeColor}
  onSlotChange={handleSlotChange}
/>
```

**Step 5: Test drag interaction manually**

- Drag down over empty pills → should fill (half if you're in the top zone, full if bottom zone)
- Drag down over full pills → should clear progressively
- Totals below each column should update

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: drag interaction — fill/clear with half/full detection"
```

---

## Task 6: Weekly total display

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/WeeklyTotal.jsx`
- Create: `src/components/WeeklyTotal.css`

**Step 1: Create `src/components/WeeklyTotal.jsx`**

```jsx
import './WeeklyTotal.css'
import { APPS, DAYS } from '../data'

function appTotal(appUsage) {
  let total = 0
  for (const day of DAYS) {
    for (const v of appUsage[day]) total += v
  }
  return total
}

function formatHours(h) {
  return h % 1 === 0 ? `${h} hours` : `${h} hours`
}

export default function WeeklyTotal({ usage }) {
  const total = APPS.reduce((sum, app) => sum + appTotal(usage[app.name]), 0)
  return (
    <div className="weekly-total">
      <span className="weekly-label">Weekly Usage Total</span>
      <span className="weekly-value">{formatHours(total)}</span>
    </div>
  )
}
```

**Step 2: Create `src/components/WeeklyTotal.css`**

```css
.weekly-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-top: 1px solid #eee;
  margin-bottom: 1rem;
}

.weekly-label {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}

.weekly-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}
```

**Step 3: Add to `App.jsx` after UsageGrid**

```jsx
import WeeklyTotal from './components/WeeklyTotal'
// In JSX:
<WeeklyTotal usage={usage} />
```

**Step 4: Verify total updates as pills are filled**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: weekly total display"
```

---

## Task 7: PhysicsContainer (Matter.js)

**Files:**
- Create: `src/components/PhysicsContainer.jsx`
- Create: `src/components/PhysicsContainer.css`
- Modify: `src/App.jsx`

**Step 1: Create `src/components/PhysicsContainer.jsx`**

This component:
- Holds a `<canvas>` and runs a Matter.js world headlessly
- A `useEffect` runs the engine loop via `requestAnimationFrame`
- Exposes a stable `spawnDot(color)` and `removeDot(color)` via `useImperativeHandle` (or just accepts a `dotsRef` from the parent)
- Actually simpler: accepts `dots` array as a prop describing desired state; the component reconciles Matter.js bodies to match

The cleanest pattern: pass a `pendingEvents` ref from App, and use an effect that watches it.

Actually the simplest approach: the parent calls `spawnDot` / `removeDot` functions exposed via a `ref`. Use `forwardRef` + `useImperativeHandle`.

```jsx
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import Matter from 'matter-js'
import './PhysicsContainer.css'
import { APPS } from '../data'

const { Engine, World, Bodies, Body, Events, Runner } = Matter

const DOT_RADIUS = 6

const PhysicsContainer = forwardRef(function PhysicsContainer(_, ref) {
  const canvasRef = useRef()
  const engineRef = useRef()
  const bodiesRef = useRef([]) // { body, color }[]
  const rafRef    = useRef()

  useImperativeHandle(ref, () => ({
    spawnDot(color) {
      if (!engineRef.current) return
      const canvas = canvasRef.current
      const W = canvas.width
      const x = W * 0.1 + Math.random() * W * 0.8
      const body = Bodies.circle(x, -DOT_RADIUS * 2, DOT_RADIUS, {
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.01,
        label: color,
      })
      World.add(engineRef.current.world, body)
      bodiesRef.current.push({ body, color })
    },
    removeDot(color) {
      if (!engineRef.current) return
      // Remove the most recently added dot of this color
      const idx = [...bodiesRef.current].reverse().findIndex(d => d.color === color)
      if (idx === -1) return
      const realIdx = bodiesRef.current.length - 1 - idx
      const { body } = bodiesRef.current[realIdx]
      World.remove(engineRef.current.world, body)
      bodiesRef.current.splice(realIdx, 1)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Size canvas to its CSS layout size
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Rebuild walls when size changes
      if (engineRef.current) rebuildWalls(engineRef.current.world, canvas.width, canvas.height)
    })
    ro.observe(canvas)
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const engine = Engine.create({ gravity: { y: 1.5 } })
    engineRef.current = engine

    function rebuildWalls(world, W, H) {
      // Remove old walls
      const walls = world.bodies.filter(b => b.isStatic && b.label === 'wall')
      walls.forEach(w => World.remove(world, w))
      const opts = { isStatic: true, label: 'wall', friction: 0.3, restitution: 0.2 }
      World.add(world, [
        Bodies.rectangle(W / 2, H + 25, W + 100, 50, opts),  // floor
        Bodies.rectangle(-25,    H / 2, 50, H * 2,  opts),   // left
        Bodies.rectangle(W + 25, H / 2, 50, H * 2,  opts),   // right
      ])
    }

    rebuildWalls(engine.world, canvas.width, canvas.height)

    const runner = Runner.create()
    Runner.run(runner, engine)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const { body, color } of bodiesRef.current) {
        const { x, y } = body.position
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      Runner.stop(runner)
      ro.disconnect()
    }
  }, [])

  // Legend: per-app totals are passed as a prop
  return (
    <div className="physics-wrap">
      <canvas ref={canvasRef} className="physics-canvas" />
    </div>
  )
})

export default PhysicsContainer
```

**Step 2: Create `src/components/PhysicsContainer.css`**

```css
.physics-wrap {
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.physics-canvas {
  width: 100%;
  height: 140px;
  display: block;
}
```

**Step 3: Add legend below physics canvas — extend PhysicsContainer to accept `usage` prop**

Add a `usage` prop to PhysicsContainer. Below the canvas, render the legend:

```jsx
// Add to PhysicsContainer props: usage
// Add below canvas in JSX:
<div className="physics-legend">
  {APPS.map(app => {
    const total = DAYS.reduce((sum, day) =>
      sum + usage[app.name][day].reduce((s, v) => s + v, 0), 0)
    if (total === 0) return null
    return (
      <span key={app.name} className="legend-item">
        <span className="legend-dot" style={{ background: app.color }} />
        {app.name}: {total}h
      </span>
    )
  })}
</div>
```

Add to CSS:

```css
.physics-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.6rem 1rem 0.75rem;
  font-size: 0.82rem;
  color: #555;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

**Step 4: Wire into `App.jsx`**

The key wiring: when a slot value changes, compute the delta and call `spawnDot`/`removeDot`. Track previous usage in a ref to compute deltas.

```jsx
import { useState, useRef, useCallback, useEffect } from 'react'
import PhysicsContainer from './components/PhysicsContainer'

// In App():
const physicsRef = useRef()
const prevUsageRef = useRef(null)

// After setUsage resolves, compare old vs new to spawn/remove dots
// Use a useEffect that watches usage:
useEffect(() => {
  if (!prevUsageRef.current) {
    prevUsageRef.current = usage
    return
  }
  const prev = prevUsageRef.current
  for (const app of APPS) {
    for (const day of DAYS) {
      const prevSlots = prev[app.name][day]
      const nextSlots = usage[app.name][day]
      for (let i = 0; i < nextSlots.length; i++) {
        const delta = nextSlots[i] - prevSlots[i]
        if (delta > 0) {
          // Each 0.5 increase = 1 dot
          const dots = Math.round(delta / 0.5)
          for (let d = 0; d < dots; d++) physicsRef.current?.spawnDot(app.color)
        } else if (delta < 0) {
          const dots = Math.round(Math.abs(delta) / 0.5)
          for (let d = 0; d < dots; d++) physicsRef.current?.removeDot(app.color)
        }
      }
    }
  }
  prevUsageRef.current = usage
}, [usage])

// In JSX after WeeklyTotal:
<PhysicsContainer ref={physicsRef} usage={usage} />
```

**Step 5: Test physics**

- Fill several pills → dots should fall and bounce into the container
- Clear pills → dots should disappear
- Switch app tabs, fill more → different colored dots appear
- Legend updates

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: Matter.js physics container with dot spawn/remove and legend"
```

---

## Task 8: Polish + empty state hint

**Files:**
- Modify: `src/components/PhysicsContainer.jsx`
- Modify: `src/App.css`

**Step 1: Add empty state hint inside physics canvas area**

When no dots exist, show the prompt text from the screenshots. Add to PhysicsContainer JSX:

```jsx
// Compute hasAnyUsage from usage prop
const hasAnyUsage = APPS.some(app =>
  DAYS.some(day => usage[app.name][day].some(v => v > 0))
)

// In JSX, inside .physics-wrap, before canvas:
{!hasAnyUsage && (
  <div className="physics-empty">Fill in your usage to see the pile grow</div>
)}
```

CSS:
```css
.physics-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.9rem;
  pointer-events: none;
}
```

Make `.physics-wrap` `position: relative`.

**Step 2: Verify empty state shows on load, disappears when first pill is filled**

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: empty state hint in physics container"
```

---

## Task 9: Portfolio experiment card

**Files:**
- Modify: `/Users/taylorcornelius/Desktop/portfolio/src/components/Pages/Experiments.jsx`

**Step 1: Add new entry to the `experiments` array in Experiments.jsx**

Open `Experiments.jsx` and find the `experiments` array (around line 109). Add this entry after `DICE_ROLLER`:

```js
{
  title: 'DRAG_INTERACTION',
  description: 'How much time do you really spend? Drag across pills to paint your weekly screen time. Physics-driven dots pile up as the hours grow.',
  tags: ['Interaction', 'Physics', 'Data Viz'],
  link: 'https://nyarlat-hotep.github.io/drag-interaction/',
  status: 'OPERATIONAL',
  action: null,
},
```

**Step 2: Verify card appears in portfolio experiments page**

**Step 3: Commit portfolio**

```bash
cd /Users/taylorcornelius/Desktop/portfolio
git add src/components/Pages/Experiments.jsx
git commit -m "feat: add DRAG_INTERACTION experiment card"
```

---

## Task 10: Final deploy

**Step 1: Build drag-interaction and verify no errors**

```bash
cd /Users/taylorcornelius/Desktop/drag-interaction
npm run build
```

Expected: clean build, no errors.

**Step 2: Push drag-interaction to trigger gh-pages deploy**

```bash
git push origin main
```

**Step 3: Push portfolio**

```bash
cd /Users/taylorcornelius/Desktop/portfolio
git push origin main
```

**Step 4: Verify GitHub Actions completes successfully on both repos**

Check: `https://github.com/Nyarlat-hotep/drag-interaction/actions`
