import DayBar from './DayBar'
import './MobileDayGrid.css'
import { DAYS } from '../data'

function calcDayTotal(slots) {
  return slots.reduce((sum, v) => sum + v, 0)
}

export default function MobileDayGrid({ usage, activeApp, activeColor, onDayChange }) {
  return (
    <div className="mobile-day-grid">
      {DAYS.map((day) => {
        const slots = usage[activeApp][day]
        const total = calcDayTotal(slots)
        return (
          <DayBar
            key={day}
            day={day}
            value={total}
            color={activeColor}
            onChange={(newTotal) => onDayChange(day, newTotal)}
          />
        )
      })}
    </div>
  )
}
