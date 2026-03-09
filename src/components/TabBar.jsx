import './TabBar.css'
import { APPS } from '../data'

export default function TabBar({ activeApp, onSelect }) {
  return (
    <div className="tab-bar">
      {APPS.map((app) => (
        <button
          key={app.name}
          className={`tab ${activeApp === app.name ? 'tab--active' : ''}`}
          onClick={() => onSelect(app.name)}
          style={activeApp === app.name ? { borderColor: app.color } : {}}
        >
          {app.name}
        </button>
      ))}
    </div>
  )
}
