import { useState } from 'react'
import { APPS, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import UsageGrid from './components/UsageGrid'
import './App.css'

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)

  const activeColor = APPS.find(a => a.name === activeApp)?.color ?? '#000'

  return (
    <div className="app">
      <h1 className="app-title">How much time do you spend?</h1>
      <p className="app-subtitle">
        Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
      </p>
      <TabBar activeApp={activeApp} onSelect={setActiveApp} />
      <UsageGrid
        usage={usage}
        activeApp={activeApp}
        activeColor={activeColor}
        onSlotChange={() => {}}
      />
    </div>
  )
}
