import { useEffect, useRef } from 'react'

/**
 * 粒子小地球：ASCII 字符粒子组成线框地球（经纬网 + 轮廓圈），缓慢自转。
 * - 鼠标碰到哪，附近的粒子就被推开并跟随光标（带动量传递）
 * - 鼠标离开后弹性聚拢复原
 */

const MONO = `ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace`
const W = 220
const H = 220
const CX = W / 2
const CY = H / 2
const R = 80
const TILT = 0.38 // 视角倾角
const SPIN = 0.22 // 自转角速度 rad/s
const REPEL_R = 105
const SPRING = 0.052
const DAMPING = 0.875

const rand = (a: number, b: number) => a + Math.random() * (b - a)

interface P {
  surface: boolean // true = 球面经纬粒子（随自转），false = 轮廓圈
  ux: number
  uy: number
  uz: number
  lx: number
  ly: number
  ch: string
  size: number
  color: string
  baseAlpha: number
  pulse: number
  phase: number
  x: number
  y: number
  vx: number
  vy: number
}

function makeParticle(p: Omit<P, 'x' | 'y' | 'vx' | 'vy'>): P {
  return { ...p, x: rand(0, W), y: rand(0, H), vx: 0, vy: 0 }
}

function buildParticles(): P[] {
  const parts: P[] = []
  const pushSurface = (ux: number, uy: number, uz: number) => {
    const r = Math.random()
    parts.push(
      makeParticle({
        surface: true, ux, uy, uz, lx: 0, ly: 0,
        ch: r < 0.7 ? '·' : r < 0.9 ? '∙' : '+',
        size: rand(9, 12),
        color: Math.random() < 0.7 ? '#c7cdd8' : '#9aa3b2',
        baseAlpha: rand(0.55, 0.95),
        pulse: rand(0.6, 1.4), phase: rand(0, Math.PI * 2),
      }),
    )
  }

  // 纬线
  for (const deg of [-60, -30, 0, 30, 60]) {
    const phi = (deg * Math.PI) / 180
    const count = Math.round(42 * Math.cos(phi))
    for (let i = 0; i < count; i++) {
      const lam = (i / count) * Math.PI * 2
      pushSurface(
        Math.cos(phi) * Math.sin(lam),
        Math.sin(phi),
        Math.cos(phi) * Math.cos(lam),
      )
    }
  }
  // 经线
  for (let m = 0; m < 6; m++) {
    const lam = (m / 6) * Math.PI
    const sinL = Math.sin(lam)
    const cosL = Math.cos(lam)
    for (let i = 0; i < 22; i++) {
      const s = (i / 22) * Math.PI * 2
      pushSurface(sinL * Math.sin(s), Math.cos(s), cosL * Math.sin(s))
    }
  }
  // 轮廓圈（静止）
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2
    parts.push(
      makeParticle({
        surface: false, ux: 0, uy: 0, uz: 0,
        lx: CX + R * Math.cos(a), ly: CY + R * Math.sin(a),
        ch: '·', size: rand(9, 12), color: '#b9c2d0',
        baseAlpha: rand(0.5, 0.85),
        pulse: rand(0.6, 1.4), phase: rand(0, Math.PI * 2),
      }),
    )
  }
  return parts
}

export function ParticleGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const parts = buildParticles()
    const pm = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, active: false }

    const drawChar = (p: P, x: number, y: number, alpha: number) => {
      ctx.font = `${p.size}px ${MONO}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.fillText(p.ch, x, y)
    }

    // 球面粒子投影：绕 Y 轴自转 + 绕 X 轴倾角
    const project = (p: P, t: number): [number, number, number] => {
      const sigma = SPIN * t
      const X = R * (p.ux * Math.cos(sigma) + p.uz * Math.sin(sigma))
      const Z = R * (-p.ux * Math.sin(sigma) + p.uz * Math.cos(sigma))
      const Y = R * p.uy
      const y2 = Y * Math.cos(TILT) - Z * Math.sin(TILT)
      const z2 = Y * Math.sin(TILT) + Z * Math.cos(TILT)
      return [CX + X, CY - y2, z2 / R]
    }

    let raf = 0
    let last = performance.now()
    let running = true

    const frame = (now: number) => {
      if (!running) return
      const dt = Math.min(32, now - last) / 16.67
      last = now
      const t = now / 1000
      ctx.clearRect(0, 0, W, H)

      // 指针每帧速度（动量传递）
      if (pm.active) {
        pm.vx = pm.x - pm.px
        pm.vy = pm.y - pm.py
      }
      pm.px = pm.x
      pm.py = pm.y

      for (const p of parts) {
        // 目标位置与深度
        let hx: number
        let hy: number
        let alpha: number
        if (p.surface) {
          const [sx, sy, depth] = project(p, t)
          hx = sx
          hy = sy
          alpha = p.baseAlpha * (0.35 + 0.65 * ((depth + 1) / 2))
        } else {
          hx = p.lx
          hy = p.ly
          alpha = p.baseAlpha
        }
        alpha *= 0.82 + 0.18 * Math.sin(t * p.pulse + p.phase)

        // 弹簧回位
        p.vx += (hx - p.x) * SPRING * dt
        p.vy += (hy - p.y) * SPRING * dt

        // 鼠标斥力 + 动量传递
        if (pm.active) {
          const dx = p.x - pm.x
          const dy = p.y - pm.y
          const d2 = dx * dx + dy * dy
          if (d2 < REPEL_R * REPEL_R) {
            const d = Math.sqrt(d2) || 1
            const f = 1 - d / REPEL_R
            const push = f * f * 9.5 * dt
            p.vx += (dx / d) * push + pm.vx * 0.16 * f
            p.vy += (dy / d) * push + pm.vy * 0.16 * f
          }
        }

        p.vx *= DAMPING
        p.vy *= DAMPING
        p.x += p.vx * dt
        p.y += p.vy * dt

        drawChar(p, p.x, p.y, Math.min(1, alpha))
      }

      raf = requestAnimationFrame(frame)
    }

    const renderOnce = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        if (p.surface) {
          const [sx, sy, depth] = project(p, 0)
          p.x = sx
          p.y = sy
          drawChar(p, sx, sy, p.baseAlpha * (0.35 + 0.65 * ((depth + 1) / 2)))
        } else {
          p.x = p.lx
          p.y = p.ly
          drawChar(p, p.lx, p.ly, p.baseAlpha)
        }
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pm.x = (e.clientX - rect.left) * (W / rect.width)
      pm.y = (e.clientY - rect.top) * (H / rect.height)
      pm.active = true
    }
    const onLeave = () => {
      pm.active = false
    }

    canvas.addEventListener('pointermove', onMove, { passive: true })
    canvas.addEventListener('pointerleave', onLeave)

    if (reducedMotion) {
      renderOnce()
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="mx-auto block cursor-crosshair"
      style={{ width: 'min(150px, 60%)', aspectRatio: `${W} / ${H}` }}
    />
  )
}
