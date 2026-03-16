import { useRef, useEffect, useState } from 'react'
import './TabBar.css'
import { APPS } from '../data'

export default function TabBar({ activeApp, onSelect }) {
  const btnRefs    = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const activeIndex = APPS.findIndex(a => a.name === activeApp)
  const activeColor = APPS[activeIndex]?.color ?? '#ffffff'

  useEffect(() => {
    const btn = btnRefs.current[activeIndex]
    if (!btn) return
    setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [activeIndex])

  return (
    <div className="tab-bar">
      <div
        className="tab-indicator"
        style={{
          left:       indicator.left,
          width:      indicator.width,
          background: `${activeColor}26`,
          boxShadow:  `0 0 10px ${activeColor}33`,
        }}
      />
      {APPS.map((app, i) => (
        <button
          key={app.name}
          ref={el => { btnRefs.current[i] = el }}
          className={`tab ${activeApp === app.name ? 'tab--active' : ''}`}
          onClick={() => onSelect(app.name)}
          style={activeApp === app.name ? { color: app.color } : {}}
        >
          {app.name}
        </button>
      ))}
    </div>
  )
}
