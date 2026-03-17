import './WeeklyTotal.css'
import { APPS, DAYS } from '../data'

function appTotal(appUsage) {
  let total = 0
  for (const day of DAYS) {
    for (const v of appUsage[day]) total += v
  }
  return total
}

export default function WeeklyTotal({ usage }) {
  const total = APPS.reduce((sum, app) => sum + appTotal(usage[app.name]), 0)
  return (
    <div className="weekly-total">
      <span className="weekly-label">Weekly total</span>
      <span className="weekly-value">{total} hours</span>
    </div>
  )
}
