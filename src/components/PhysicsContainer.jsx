import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import Matter from 'matter-js'
import './PhysicsContainer.css'
import { APPS, DAYS } from '../data'

const { Engine, World, Bodies, Runner } = Matter

function getDotRadius() {
  return window.innerWidth <= 768 ? 7 : 12
}

// Parse a hex color and return a lightened/darkened version
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c) => Math.round(c + (255 - c) * amount)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}
function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c) => Math.round(c * (1 - amount))
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

const PhysicsContainer = forwardRef(function PhysicsContainer({ usage }, ref) {
  const canvasRef  = useRef()
  const engineRef  = useRef()
  const bodiesRef  = useRef([]) // { body, color }[]
  const rafRef     = useRef()

  useImperativeHandle(ref, () => ({
    spawnDot(color) {
      if (!engineRef.current || !canvasRef.current) return
      const W = canvasRef.current.offsetWidth  // CSS pixels
      const r = getDotRadius()
      const x = W * 0.1 + Math.random() * W * 0.8
      const body = Bodies.circle(x, -r * 2, r, {
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
      const r = getDotRadius()
      World.add(world, [
        Bodies.rectangle(W / 2,        H + 15,  W + 100, 50,    opts), // floor
        Bodies.rectangle(r - 25,       H / 2,   50,      H * 2, opts), // left
        Bodies.rectangle(W - r + 25,   H / 2,   50,      H * 2, opts), // right
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
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)
      for (const { body, color } of bodiesRef.current) {
        const { x, y } = body.position
        const r = body.circleRadius
        // Highlight offset — light source at top-left
        const hx = x - r * 0.3
        const hy = y - r * 0.35
        const grad = ctx.createRadialGradient(hx, hy, r * 0.05, x, y, r)
        grad.addColorStop(0,   lighten(color, 0.55))
        grad.addColorStop(0.45, color)
        grad.addColorStop(1,   darken(color, 0.35))
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
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

  const hasAnyUsage = APPS.some(app =>
    DAYS.some(day => usage[app.name][day].some(v => v > 0))
  )

  return (
    <div className="physics-wrap">
      <canvas ref={canvasRef} className="physics-canvas" />
      {!hasAnyUsage && (
        <div className="physics-empty">Fill in your usage to see the pile grow</div>
      )}
    </div>
  )
})

export default PhysicsContainer
