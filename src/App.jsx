import { useState, useRef, useCallback, useEffect } from 'react'
import { APPS, DAYS, SLOTS_PER_DAY, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import UsageGrid from './components/UsageGrid'
import WeeklyTotal from './components/WeeklyTotal'
import PhysicsContainer from './components/PhysicsContainer'
import MobileDayGrid from './components/MobileDayGrid'
import './App.css'

function totalToSlots(total) {
  const slots = new Array(SLOTS_PER_DAY).fill(0)
  let remaining = total
  for (let i = 0; i < SLOTS_PER_DAY && remaining > 0; i++) {
    if (remaining >= 1) {
      slots[i] = 1
      remaining -= 1
    } else {
      slots[i] = 0.5
      remaining -= 0.5
    }
  }
  return slots
}

function computeFillValue(clientY, element) {
  const rect = element.getBoundingClientRect()
  const relY = (clientY - rect.top) / rect.height  // 0 = top, 1 = bottom
  return relY < 0.5 ? 0.5 : 1
}

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)
  const dragRef     = useRef({ active: false })
  const activeAppRef = useRef(activeApp)
  const physicsRef  = useRef()
  const [theme, setTheme] = useState('dark')
  const [dragTooltip, setDragTooltip] = useState(null) // { x, y, day }

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : ''
  }, [theme])

  const prevUsageRef = useRef(null)
  const lastSlotRef  = useRef({}) // { [day]: slotIndex }
  useEffect(() => { activeAppRef.current = activeApp }, [activeApp])

  const activeColor = APPS.find(a => a.name === activeApp)?.color ?? '#000'

  // End drag on pointer up anywhere
  useEffect(() => {
    const end = () => {
      dragRef.current.active = false
      lastSlotRef.current = {}
      setDragTooltip(null)
    }
    window.addEventListener('pointerup', end)
    return () => window.removeEventListener('pointerup', end)
  }, [])

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

  const applySlot = useCallback((day, slotIndex, newValue) => {
    setUsage(prev => {
      const app = activeAppRef.current
      const daySlots = [...prev[app][day]]
      if (daySlots[slotIndex] === newValue) return prev  // no-op
      daySlots[slotIndex] = newValue
      return {
        ...prev,
        [app]: { ...prev[app], [day]: daySlots },
      }
    })
  }, [])

  // Direction-aware drag: forward fills (completing skipped pills), backward clears.
  const handleDragSlot = useCallback((day, slotIndex, value) => {
    const last = lastSlotRef.current[day]

    if (last === undefined || slotIndex === last) {
      lastSlotRef.current[day] = slotIndex
      applySlot(day, slotIndex, value)
      return
    }

    if (slotIndex > last) {
      // Moving forward: complete last pill, fill any skipped, set current
      applySlot(day, last, 1)
      for (let i = last + 1; i < slotIndex; i++) {
        applySlot(day, i, 1)
      }
    } else {
      // Moving backward: clear from last down through current slot (all the way to 0)
      for (let i = last; i >= slotIndex; i--) {
        applySlot(day, i, 0)
      }
      lastSlotRef.current[day] = slotIndex
      return
    }

    lastSlotRef.current[day] = slotIndex
    applySlot(day, slotIndex, value)
  }, [applySlot])

  const handleDayChange = useCallback((day, newTotal) => {
    setUsage(prev => {
      const app = activeAppRef.current
      const slots = totalToSlots(newTotal)
      return { ...prev, [app]: { ...prev[app], [day]: slots } }
    })
  }, [])

  const handleKeyActivate = useCallback((day, slotIndex) => {
    setUsage(prev => {
      const app = activeAppRef.current
      const daySlots = [...prev[app][day]]
      const cur = daySlots[slotIndex]
      daySlots[slotIndex] = cur === 0 ? 0.5 : cur === 0.5 ? 1 : 0
      return { ...prev, [app]: { ...prev[app], [day]: daySlots } }
    })
  }, [])

  const handleSlotChange = useCallback((e, day, slotIndex) => {
    e.preventDefault()
    dragRef.current = { active: true }
    lastSlotRef.current = { [day]: slotIndex }
    // Fill all slots above this one so the fill is always contiguous from the top
    for (let i = 0; i < slotIndex; i++) applySlot(day, i, 1)
    applySlot(day, slotIndex, computeFillValue(e.clientY, e.currentTarget))
    setDragTooltip({ x: e.clientX, y: e.clientY, day })
  }, [applySlot])

  // Compute fill value from cursor position within a pill.
  // On the SAME pill, top-third clears to 0 so the first pill (slot 0) can be erased.
  // On a NEW pill (entering from outside), only 0.5 or 1 — no accidental clearing.
  function pillValue(relY, isSamePill) {
    if (isSamePill) return relY < 0.33 ? 0 : relY < 0.66 ? 0.5 : 1
    return relY < 0.5 ? 0.5 : 1
  }

  // Pointer move on grid: elementFromPoint handles fast drags that skip pointerenter
  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return
    const pill = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]')
    if (!pill) return
    const slotIndex = Number(pill.dataset.slot)
    const day = pill.dataset.day
    const rect = pill.getBoundingClientRect()
    const relY = (e.clientY - rect.top) / rect.height
    handleDragSlot(day, slotIndex, pillValue(relY, lastSlotRef.current[day] === slotIndex))
    setDragTooltip({ x: e.clientX, y: e.clientY, day })
  }, [handleDragSlot])

  // Touch support: touchmove fires only on the element where touch started,
  // so we use elementFromPoint to find the pill under the finger
  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.active) return
    e.preventDefault()
    const touch = e.touches[0]
    const pill = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-slot]')
    if (!pill) return
    const slotIndex = Number(pill.dataset.slot)
    const day = pill.dataset.day
    const rect = pill.getBoundingClientRect()
    const relY = (touch.clientY - rect.top) / rect.height
    handleDragSlot(day, slotIndex, pillValue(relY, lastSlotRef.current[day] === slotIndex))
  }, [handleDragSlot])

  return (
    <div className="app-layout">
      <div className="app">
        <button
          className="theme-toggle"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <h1 className="app-title">How much time do you spend?</h1>
        <p className="app-subtitle">
          Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
        </p>
        <TabBar activeApp={activeApp} onSelect={setActiveApp} />
        <MobileDayGrid
          usage={usage}
          activeApp={activeApp}
          activeColor={activeColor}
          onDayChange={handleDayChange}
        />
        <div
          className="usage-area"
          onTouchMove={handleTouchMove}
          style={{ touchAction: 'none' }}
        >
          <UsageGrid
            usage={usage}
            activeApp={activeApp}
            activeColor={activeColor}
            onSlotChange={handleSlotChange}
            onPointerMove={handlePointerMove}
            onKeyActivate={handleKeyActivate}
          />
          <WeeklyTotal usage={usage} />
        </div>
      </div>
      <div className="physics-card">
        <PhysicsContainer ref={physicsRef} usage={usage} />
        {APPS.some(app => DAYS.some(day => usage[app.name][day].some(v => v > 0))) && (
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
        )}
      </div>
      {dragTooltip && (() => {
        const total = usage[activeApp][dragTooltip.day]?.reduce((s, v) => s + v, 0) ?? 0
        if (total >= 24) return null
        return (
          <div
            className="desktop-drag-tooltip"
            style={{ left: dragTooltip.x, top: dragTooltip.y - 36 }}
          >
            {total}h
          </div>
        )
      })()}
    </div>
  )
}
