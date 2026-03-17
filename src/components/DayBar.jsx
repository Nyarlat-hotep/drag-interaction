import { useRef, useState } from 'react'
import './DayBar.css'

function formatHours(h) {
  if (h === 0) return '0h'
  if (h % 1 === 0) return `${h}h`
  return `${h}h`
}

export default function DayBar({ day, total, color, onChange }) {
  const barRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [tooltipY, setTooltipY] = useState(0)
  const [liveValue, setLiveValue] = useState(0)

  function compute(clientY) {
    const rect = barRef.current.getBoundingClientRect()
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const value = Math.round(relY * 24 * 2) / 2
    const tipY = clientY - rect.top - 40
    return { value, tipY }
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    barRef.current.setPointerCapture(e.pointerId)
    const { value, tipY } = compute(e.clientY)
    setDragging(true)
    setLiveValue(value)
    setTooltipY(tipY)
    onChange(day, value)
  }

  const handlePointerMove = (e) => {
    if (!dragging) return
    const { value, tipY } = compute(e.clientY)
    setLiveValue(value)
    setTooltipY(tipY)
    onChange(day, value)
  }

  const handlePointerUp = () => {
    setDragging(false)
  }

  const fillPct = (total / 24) * 100

  return (
    <div className="day-bar-wrapper">
      <span className="day-bar-label">{day}</span>
      <span className="day-bar-value">{formatHours(total)}</span>
      <div
        className="day-bar-track"
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="day-bar-fill"
          style={{ height: `${fillPct}%`, backgroundColor: color }}
        />
        {dragging && liveValue < 24 && (
          <div className="day-bar-tooltip" style={{ top: tooltipY, borderColor: color }}>
            {formatHours(liveValue)}
          </div>
        )}
      </div>
    </div>
  )
}
