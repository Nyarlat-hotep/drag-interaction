import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import Matter from 'matter-js'
import './PhysicsContainer.css'
import { APPS, DAYS } from '../data'

const { Engine, World, Bodies, Runner } = Matter

const DOT_RADIUS = 6

const PhysicsContainer = forwardRef(function PhysicsContainer({ usage }, ref) {
  const canvasRef  = useRef()
  const engineRef  = useRef()
  const bodiesRef  = useRef([]) // { body, color }[]
  const rafRef     = useRef()

  useImperativeHandle(ref, () => ({
    spawnDot(color) {
      if (!engineRef.current || !canvasRef.current) return
      const W = canvasRef.current.offsetWidth  // CSS pixels
      const x = W * 0.1 + Math.random() * W * 0.8
      const body = Bodies.circle(x, -DOT_RADIUS * 2, DOT_RADIUS, {
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.01,
        label: color,
      })
      World.add(engineRef.current.world, body)
      bodiesRef.current.push({ body, color })
    },
    removeDot(color) {
      if (!engineRef.current) return
      const idx = [...bodiesRef.current].reverse().findIndex(d => d.color === color)
      if (idx === -1) return
      const realIdx = bodiesRef.current.length - 1 - idx
      const { body } = bodiesRef.current[realIdx]
      World.remove(engineRef.current.world, body)
      bodiesRef.current.splice(realIdx, 1)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const engine = Engine.create({ gravity: { y: 1.5 } })
    engineRef.current = engine

    function rebuildWalls(world, W, H) {
      const old = world.bodies.filter(b => b.isStatic && b.label === 'wall')
      old.forEach(w => World.remove(world, w))
      const opts = { isStatic: true, label: 'wall', friction: 0.3, restitution: 0.2 }
      World.add(world, [
        Bodies.rectangle(W / 2, H + 25,  W + 100, 50,   opts), // floor
        Bodies.rectangle(-25,   H / 2,   50,      H * 2, opts), // left
        Bodies.rectangle(W + 25, H / 2,  50,      H * 2, opts), // right
      ])
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const cssW = canvas.offsetWidth
      const cssH = canvas.offsetHeight
      canvas.width  = cssW * dpr
      canvas.height = cssH * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (engineRef.current) rebuildWalls(engineRef.current.world, cssW, cssH)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const runner = Runner.create()
    Runner.run(runner, engine)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      for (const { body, color } of bodiesRef.current) {
        const { x, y } = body.position
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      Runner.stop(runner)
      ro.disconnect()
    }
  }, [])

  // Legend
  const hasAnyUsage = APPS.some(app =>
    DAYS.some(day => usage[app.name][day].some(v => v > 0))
  )

  return (
    <div className="physics-wrap">
      <canvas ref={canvasRef} className="physics-canvas" />
      {!hasAnyUsage && (
        <div className="physics-empty">Fill in your usage to see the pile grow</div>
      )}
      {hasAnyUsage && (
        <div className="physics-legend">
          {APPS.map(app => {
            const total = DAYS.reduce((sum, day) =>
              sum + usage[app.name][day].reduce((s, v) => s + v, 0), 0)
            if (total === 0) return null
            return (
              <span key={app.name} className="legend-item">
                <span className="legend-dot" style={{ background: app.color }} />
                {app.name}: {total}h
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
})

export default PhysicsContainer
