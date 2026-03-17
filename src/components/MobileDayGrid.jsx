import { DAYS, HOURS_PER_SLOT } from '../data'
import DayBar from './DayBar'
import './MobileDayGrid.css'

function dayTotal(usage, app, day) {
  return usage[app][day].reduce((sum, v) => sum + v, 0) * HOURS_PER_SLOT
}

export default function MobileDayGrid({ usage, activeApp, activeColor, onDayChange }) {
  return (
    <div className="mobile-day-grid">
      {DAYS.map(day => (
        <DayBar
          key={day}
          day={day}
          total={dayTotal(usage, activeApp, day)}
          color={activeColor}
          onChange={onDayChange}
        />
      ))}
    </div>
  )
}
