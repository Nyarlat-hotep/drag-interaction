import Pill from './Pill'
import './UsageGrid.css'
import { DAYS } from '../data'

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
