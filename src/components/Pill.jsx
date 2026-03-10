import './Pill.css'
import { DAYS, SLOTS_PER_DAY } from '../data'

export default function Pill({ value, color, slotIndex, day, onPointerDown, onKeyActivate }) {
  const fillPct = value === 1 ? '100%' : value === 0.5 ? '50%' : '0%'

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onKeyActivate?.()
      return
    }
    const dayIdx = DAYS.indexOf(day)
    let targetDay = day
    let targetSlot = slotIndex
    if      (e.key === 'ArrowDown')  { e.preventDefault(); targetSlot = slotIndex + 1 }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); targetSlot = slotIndex - 1 }
    else if (e.key === 'ArrowRight') { e.preventDefault(); targetDay  = DAYS[dayIdx + 1] }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); targetDay  = DAYS[dayIdx - 1] }
    else return
    if (!targetDay || targetSlot < 0 || targetSlot >= SLOTS_PER_DAY) return
    document.querySelector(`[data-slot="${targetSlot}"][data-day="${targetDay}"]`)?.focus()
  }

  return (
    <div
      className="pill"
      data-slot={slotIndex}
      data-day={day}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={handleKeyDown}
      style={{ '--pill-color': color }}
    >
      <div
        className="pill-fill"
        style={{ height: fillPct, backgroundColor: color }}
      />
    </div>
  )
}
