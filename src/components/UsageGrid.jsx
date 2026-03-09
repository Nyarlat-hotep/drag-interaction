import Pill from './Pill'
import './UsageGrid.css'
import { DAYS, SLOTS_PER_DAY } from '../data'

function calcDayTotal(slots) {
  return slots.reduce((sum, v) => sum + v, 0)
}

function formatHours(h) {
  return `${h}h`
}

export default function UsageGrid({ usage, activeApp, activeColor, onSlotChange, onPointerMove }) {
  return (
    <div className="usage-grid" onPointerMove={onPointerMove}>
      {DAYS.map((day) => {
        const slots = usage[activeApp][day]
        const total = calcDayTotal(slots)
        return (
          <div key={day} className="day-col">
            <div className="day-label">{day}</div>
            <div className="pill-rows">
              {Array.from({ length: SLOTS_PER_DAY / 2 }, (_, row) => (
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
                        onPointerDown={(e) => onSlotChange(e, day, slotIndex)}
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
