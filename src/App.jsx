import { useState } from 'react'
import { APPS, makeEmptyUsage } from './data'
import TabBar from './components/TabBar'
import './App.css'

export default function App() {
  const [activeApp, setActiveApp] = useState(APPS[0].name)
  const [usage, setUsage] = useState(makeEmptyUsage)

  return (
    <div className="app">
      <h1 className="app-title">How much time do you spend?</h1>
      <p className="app-subtitle">
        Drag across the dots to paint your daily usage. Half-fill for 30 min, full for 1 hour.
      </p>
      <TabBar activeApp={activeApp} onSelect={setActiveApp} />
    </div>
  )
}
