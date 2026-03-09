import './Pill.css'

export default function Pill({ value, color, slotIndex, day, onPointerEnter, onPointerDown }) {
  const fillPct = value === 1 ? '100%' : value === 0.5 ? '50%' : '0%'

  return (
    <div
      className="pill"
      data-slot={slotIndex}
      data-day={day}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
    >
      <div
        className="pill-fill"
        style={{ height: fillPct, backgroundColor: color }}
      />
    </div>
  )
}
