import { useRef, useState } from 'react'
import './DayBar.css'

function snapToHalf(value) {
  return Math.round(value * 2) / 2
}

export default function DayBar({ value, day, color, onChange }) {
  const barRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [tipY, setTipY] = useState(0)

  const getValueFromClientY = (clientY) => {
    const rect = barRef.current.getBoundingClientRect()
    const relY = 1 - (clientY - rect.top) / rect.height
    return snapToHalf(Math.max(0, Math.min(24, relY * 24)))
  }

  const handlePointerDown = (e) => {
    e.preventDefault()
    barRef.current.setPointerCapture(e.pointerId)
    const rect = barRef.current.getBoundingClientRect()
    setTipY(e.clientY - rect.top)
    setDragging(true)
    onChange(getValueFromClientY(e.clientY))
  }

  const handlePointerMove = (e) => {
    if (!e.buttons) return
    const rect = barRef.current.getBoundingClientRect()
    setTipY(e.clientY - rect.top)
    onChange(getValueFromClientY(e.clientY))
  }

  const handlePointerUp = () => setDragging(false)

  const fillPct  = (value / 24) * 100
  const label    = value % 1 === 0 ? `${value}h` : `${value}h`

  return (
    <div className="day-bar-wrap">
      <div
        ref={barRef}
        className="day-bar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="day-bar-fill"
          style={{
            height:          `${fillPct}%`,
            backgroundColor: color,
          }}
        />

        {dragging && (
          <div
            className="day-bar-tip"
            style={{
              top:         tipY - 44,
              borderColor: color,
              color,
            }}
          >
            {label}
          </div>
        )}
      </div>

      <span className="day-bar-day">{day.slice(0, 3)}</span>
      <span
        className="day-bar-total"
        style={{ color: value > 0 ? color : undefined }}
      >
        {value > 0 ? label : '—'}
      </span>
    </div>
  )
}
