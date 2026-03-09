import { useState, useRef, useCallback, useEffect } from 'react'
import { APPS, DAYS, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import UsageGrid from './components/UsageGrid'
import WeeklyTotal from './components/WeeklyTotal'
import PhysicsContainer from './components/PhysicsContainer'
import './App.css'

function computeFillValue(clientY, element) {
  const rect = element.getBoundingClientRect()
  const relY = (clientY - rect.top) / rect.height  // 0 = top, 1 = bottom
  return relY < 0.5 ? 0.5 : 1
}

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)
  const dragRef     = useRef({ active: false, mode: null }) // mode: 'fill' | 'clear'
  const activeAppRef = useRef(activeApp)
  const physicsRef  = useRef()
  const prevUsageRef = useRef(null)
  const lastSlotRef  = useRef({}) // { [day]: slotIndex } — tracks last touched slot per day for backfill
  useEffect(() => { activeAppRef.current = activeApp }, [activeApp])

  const activeColor = APPS.find(a => a.name === activeApp)?.color ?? '#000'

  // End drag on pointer up anywhere
  useEffect(() => {
    const end = () => {
      dragRef.current.active = false
      lastSlotRef.current = {}
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

  // Fill any skipped slots between last and current (ensures left→right, top→bottom order).
  // Also completes the previous pill to full before advancing — no two adjacent half-fills.
  const fillWithBackfill = useCallback((day, slotIndex, value) => {
    const last = lastSlotRef.current[day]
    if (last !== undefined && slotIndex > last) {
      // Complete the last-touched pill before moving forward
      applySlot(day, last, 1)
      // Fill any skipped slots as full too
      for (let i = last + 1; i < slotIndex; i++) {
        applySlot(day, i, 1)
      }
    }
    lastSlotRef.current[day] = slotIndex
    applySlot(day, slotIndex, value)
  }, [applySlot])

  const handleSlotChange = useCallback((e, day, slotIndex, eventType) => {
    if (eventType === 'down') {
      e.preventDefault()
      const currentValue = usage[activeApp][day][slotIndex]
      const mode = currentValue === 1 ? 'clear' : 'fill'
      dragRef.current = { active: true, mode }
      lastSlotRef.current = { [day]: slotIndex }
      if (mode === 'fill') {
        applySlot(day, slotIndex, computeFillValue(e.clientY, e.currentTarget))
      } else {
        applySlot(day, slotIndex, 0.5)
      }
    }

    if (eventType === 'enter' && dragRef.current.active) {
      if (dragRef.current.mode === 'fill') {
        fillWithBackfill(day, slotIndex, computeFillValue(e.clientY, e.currentTarget))
      } else {
        lastSlotRef.current[day] = slotIndex
        setUsage(prev => {
          const app = activeAppRef.current
          const currentValue = prev[app][day][slotIndex]
          const next = currentValue >= 0.5 ? currentValue - 0.5 : 0
          if (next === currentValue) return prev
          const daySlots = [...prev[app][day]]
          daySlots[slotIndex] = next
          return { ...prev, [app]: { ...prev[app], [day]: daySlots } }
        })
      }
    }
  }, [applySlot, fillWithBackfill])

  // Pointer move on grid: elementFromPoint handles fast drags that skip pointerenter
  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return
    const pill = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]')
    if (!pill) return
    const slotIndex = Number(pill.dataset.slot)
    const day = pill.dataset.day
    if (dragRef.current.mode === 'fill') {
      const rect = pill.getBoundingClientRect()
      const relY = (e.clientY - rect.top) / rect.height
      fillWithBackfill(day, slotIndex, relY < 0.5 ? 0.5 : 1)
    } else {
      lastSlotRef.current[day] = slotIndex
      setUsage(prev => {
        const app = activeAppRef.current
        const currentValue = prev[app][day][slotIndex]
        const next = currentValue >= 0.5 ? currentValue - 0.5 : 0
        if (next === currentValue) return prev
        const daySlots = [...prev[app][day]]
        daySlots[slotIndex] = next
        return { ...prev, [app]: { ...prev[app], [day]: daySlots } }
      })
    }
  }, [fillWithBackfill])

  // Touch support: touchmove fires only on the element where touch started,
  // so we use elementFromPoint to find the pill under the finger
  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.active) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el) return
    const pill = el.closest('[data-slot]')
    if (!pill) return
    const slotIndex = Number(pill.dataset.slot)
    const day = pill.dataset.day
    const app = activeAppRef.current
    if (dragRef.current.mode === 'fill') {
      const rect = pill.getBoundingClientRect()
      const relY = (touch.clientY - rect.top) / rect.height
      fillWithBackfill(day, slotIndex, relY < 0.5 ? 0.5 : 1)
    } else {
      lastSlotRef.current[day] = slotIndex
      setUsage(prev => {
        const currentValue = prev[app][day][slotIndex]
        const next = currentValue >= 0.5 ? currentValue - 0.5 : 0
        if (next === currentValue) return prev
        const daySlots = [...prev[app][day]]
        daySlots[slotIndex] = next
        return { ...prev, [app]: { ...prev[app], [day]: daySlots } }
      })
    }
  }, [fillWithBackfill])

  return (
    <div className="app-layout">
      <div
        className="app"
        onTouchMove={handleTouchMove}
        style={{ touchAction: 'none' }}
      >
        <h1 className="app-title">How much time do you spend?</h1>
        <p className="app-subtitle">
          Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
        </p>
        <TabBar activeApp={activeApp} onSelect={setActiveApp} />
        <UsageGrid
          usage={usage}
          activeApp={activeApp}
          activeColor={activeColor}
          onSlotChange={handleSlotChange}
          onPointerMove={handlePointerMove}
        />
        <WeeklyTotal usage={usage} />
      </div>
      <div className="physics-card">
        <PhysicsContainer ref={physicsRef} usage={usage} />
      </div>
    </div>
  )
}
