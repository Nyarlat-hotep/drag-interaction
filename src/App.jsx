import { useState, useRef, useCallback, useEffect } from 'react'
import { APPS, DAYS, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import UsageGrid from './components/UsageGrid'
import './App.css'

function computeFillValue(clientY, element) {
  const rect = element.getBoundingClientRect()
  const relY = (clientY - rect.top) / rect.height  // 0 = top, 1 = bottom
  return relY < 0.5 ? 0.5 : 1
}

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)
  const dragRef = useRef({ active: false, mode: null }) // mode: 'fill' | 'clear'
  const activeAppRef = useRef(activeApp)
  useEffect(() => { activeAppRef.current = activeApp }, [activeApp])

  const activeColor = APPS.find(a => a.name === activeApp)?.color ?? '#000'

  // End drag on pointer up anywhere
  useEffect(() => {
    const end = () => { dragRef.current.active = false }
    window.addEventListener('pointerup', end)
    return () => window.removeEventListener('pointerup', end)
  }, [])

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

  const handleSlotChange = useCallback((e, day, slotIndex, eventType) => {
    if (eventType === 'down') {
      e.preventDefault()
      const currentValue = usage[activeApp][day][slotIndex]
      const mode = currentValue === 1 ? 'clear' : 'fill'
      dragRef.current = { active: true, mode }
      if (mode === 'fill') {
        applySlot(day, slotIndex, computeFillValue(e.clientY, e.currentTarget))
      } else {
        applySlot(day, slotIndex, currentValue === 1 ? 0.5 : 0)
      }
    }

    if (eventType === 'enter' && dragRef.current.active) {
      if (dragRef.current.mode === 'fill') {
        applySlot(day, slotIndex, computeFillValue(e.clientY, e.currentTarget))
      } else {
        const currentValue = usage[activeApp][day][slotIndex]
        applySlot(day, slotIndex, currentValue >= 0.5 ? currentValue - 0.5 : 0)
      }
    }
  }, [usage, activeApp, applySlot])

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
      applySlot(day, slotIndex, relY < 0.5 ? 0.5 : 1)
    } else {
      setUsage(prev => {
        const currentValue = prev[app][day][slotIndex]
        const next = currentValue >= 0.5 ? currentValue - 0.5 : 0
        if (next === currentValue) return prev
        const daySlots = [...prev[app][day]]
        daySlots[slotIndex] = next
        return { ...prev, [app]: { ...prev[app], [day]: daySlots } }
      })
    }
  }, [applySlot])

  return (
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
      />
    </div>
  )
}
