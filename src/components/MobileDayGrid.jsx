import { DAYS } from '../data'
import DayBar from './DayBar'
import './MobileDayGrid.css'

function dayTotal(usage, app, day) {
  return usage[app][day].reduce((sum, v) => sum + v, 0)
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
