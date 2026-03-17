import Pill from './Pill'
import './UsageGrid.css'
import { DAYS, SLOTS_PER_DAY } from '../data'

// Each row = 2 pills × max 1h = 2h. Markers sit after the row that completes each interval.
const HOUR_MARKERS = { 1: '4h', 3: '8h' }

function calcDayTotal(slots) {
  return slots.reduce((sum, v) => sum + v, 0)
}

export default function UsageGrid({ usage, activeApp, activeColor, onSlotChange, onPointerMove, onKeyActivate }) {
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
                <div key={`${activeApp}-${row}`}>
                  <div className="pill-row">
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
                          onKeyActivate={() => onKeyActivate(day, slotIndex)}
                        />
                      )
                    })}
                  </div>
                  {HOUR_MARKERS[row] && (
                    <div className="hour-marker">
                      <span className="hour-label">{HOUR_MARKERS[row]}</span>
                      <div className="hour-line" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="day-total">{total}h</div>
          </div>
        )
      })}
    </div>
  )
}
