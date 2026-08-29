import { useEffect, useRef } from 'react'

/**
 * 纯黑背景上的灰色 ASCII 星球图案层（参考字符点阵画法）：
 * - 用字符栅格渲染球体明暗（· : ∙ + * x #），带气态行星条纹与随机滴漏，
 *   形成类似 halftone 点阵画的「星球图案」
 * - 大行星带字符环（土星环），环上一颗 'o' 卫星缓慢巡游
 * - 小月球 + 若干 ASCII 原子（'+' 核、'·' 轨道、'o' 电子）
 * - 「灵动」层：约四成字符持续呼吸摇曳、明暗脉动，并有光波周期性扫过星球
 * - 鼠标交互：光标附近的字符被推开并点亮，离开后回弹复原
 * 静态字符预渲染到离屏画布并建立空间索引；动态字符逐帧绘制。
 */

const RAMP = ['·', ':', '∙', '+', '*', 'x', '#']
const CELL = 15
const MONO = `ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace`

/** 鼠标交互参数 */
const FIELD_CELL = 64
const INFLUENCE_R = 115
const CLEAR_R = 148 // 清除半宽：需 ≥ INFLUENCE_R + 最大推离(18) + 字形半径(约10)
const PUSH = 18
/** 灵动层参数 */
const ALIVE_TARGET = 900 // 参与呼吸摇曳的最大字符数

interface FChar {
  x: number
  y: number
  ch: string
  size: number
  color: string
  alpha: number
  alive: boolean
  // alive 专用
  swX: number // 摇曳频率 x
  swY: number // 摇曳频率 y
  swP1: number
  swP2: number
  swA: number // 摇曳振幅
  pSpd: number // 脉动速度
  pPh: number // 脉动相位
  pcx: number // 行星中心（光波用），-1 = 无
  pcy: number
}

interface PlanetSpec {
  cx: number
  cy: number
  r: number
  ringRot: number | null
  bandPhase: number
  rippleOffset: number
}

interface AtomSpec {
  cx: number
  cy: number
  rx: number
  ry: number
  rot1: number
  rot2: number
  nucleusSize: number
  e1: { phase: number; speed: number }
  e2: { phase: number; speed: number }
}

export function CosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const staticCanvas = document.createElement('canvas')
    const staticCtx = staticCanvas.getContext('2d')

    let w = 0
    let h = 0
    let raf = 0
    let running = true
    let planets: PlanetSpec[] = []
    let atoms: AtomSpec[] = []
    let field: FChar[] = []
    let aliveChars: FChar[] = []
    let grid = new Map<string, FChar[]>()
    let satellite: { planet: PlanetSpec; k: number; speed: number; phase: number } | null = null

    const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false }
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const ptr = { x: -9999, y: -9999, sx: -9999, sy: -9999, inside: false, strength: 0 }

    const drawChar = (
      c: CanvasRenderingContext2D,
      ch: string,
      x: number,
      y: number,
      size: number,
      color: string,
      alpha: number,
    ) => {
      c.font = `${size}px ${MONO}`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.globalAlpha = alpha
      c.fillStyle = color
      c.fillText(ch, x, y)
    }

    /** 生成一个字段字符（自动分配灵动参数） */
    const makeChar = (
      ch: string, x: number, y: number, size: number, color: string, alpha: number,
      aliveProb: number, pcx = -1, pcy = -1,
    ): FChar => {
      const alive = Math.random() < aliveProb
      return {
        x, y, ch, size, color, alpha, alive,
        swX: 0.35 + Math.random() * 0.5,
        swY: 0.3 + Math.random() * 0.45,
        swP1: Math.random() * Math.PI * 2,
        swP2: Math.random() * Math.PI * 2,
        swA: 1.6 + Math.random() * 2.6,
        pSpd: 0.5 + Math.random() * 0.9,
        pPh: Math.random() * Math.PI * 2,
        pcx, pcy,
      }
    }

    // ---------- 星球：字符栅格球体 ----------
    const drawPlanetBody = (c: CanvasRenderingContext2D | null, p: PlanetSpec, aliveProb: number) => {
      const gxs = Math.floor((p.cx - p.r) / CELL) - 1
      const gxe = Math.ceil((p.cx + p.r) / CELL) + 1
      const gys = Math.floor((p.cy - p.r) / CELL) - 1
      const gye = Math.ceil((p.cy + p.r) / CELL) + 1
      const Lx = -0.48
      const Ly = -0.6
      const Lz = 0.64
      const fontSize = Math.max(10, CELL * 0.82)

      for (let gy = gys; gy <= gye; gy++) {
        for (let gx = gxs; gx <= gxe; gx++) {
          const px = gx * CELL + CELL / 2
          const py = gy * CELL + CELL / 2
          const dx = (px - p.cx) / p.r
          const dy = (py - p.cy) / p.r
          const d2 = dx * dx + dy * dy
          if (d2 > 1) continue
          const nz = Math.sqrt(1 - d2)
          let inten = dx * Lx + dy * Ly + nz * Lz
          if (inten <= 0.04) continue
          if (p.ringRot !== null) {
            const ca = Math.cos(-p.ringRot)
            const sa = Math.sin(-p.ringRot)
            const bandU = dx * ca - dy * sa
            inten += 0.09 * Math.sin(bandU * 6.5 + p.bandPhase)
          }
          inten = Math.max(0, Math.min(1, inten))
          if (Math.random() < 0.1) continue
          const idx = Math.min(RAMP.length - 1, Math.floor(inten * RAMP.length * 1.25))
          const alpha = 0.05 + inten * 0.34
          const ch = makeChar(RAMP[idx], px, py, fontSize, '#9aa3b2', alpha, aliveProb, p.cx, p.cy)
          field.push(ch)
          if (!ch.alive && c) drawChar(c, ch.ch, ch.x, ch.y, ch.size, ch.color, ch.alpha)
        }
      }
    }

    // ---------- 行星环 ----------
    const drawRing = (c: CanvasRenderingContext2D | null, p: PlanetSpec, fontSize: number, aliveProb: number) => {
      const rot = p.ringRot!
      const steps = 170
      const bands = [1.42, 1.53, 1.66]
      for (let bi = 0; bi < bands.length; bi++) {
        const k = bands[bi]
        for (let i = 0; i < steps; i++) {
          const t = (i / steps) * Math.PI * 2
          const ex = Math.cos(t) * p.r * k
          const ey = Math.sin(t) * p.r * k * 0.3
          const rx = ex * Math.cos(rot) - ey * Math.sin(rot)
          const ry = ex * Math.sin(rot) + ey * Math.cos(rot)
          const isFront = Math.sin(t) > 0
          if (!isFront && Math.hypot(rx, ry) < p.r * 0.99) continue
          if (Math.random() < 0.28) continue
          const x = p.cx + rx
          const y = p.cy + ry
          if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue
          const alpha = isFront ? 0.3 : 0.16
          const ch = makeChar(bi === 1 ? '-' : '·', x, y, fontSize, '#9aa3b2', alpha, aliveProb, p.cx, p.cy)
          field.push(ch)
          if (!ch.alive && c) drawChar(c, ch.ch, ch.x, ch.y, ch.size, ch.color, ch.alpha)
        }
      }
    }

    const ringPoint = (p: PlanetSpec, k: number, t: number): [number, number] => {
      const rot = p.ringRot ?? 0
      const ex = Math.cos(t) * p.r * k
      const ey = Math.sin(t) * p.r * k * 0.3
      return [
        p.cx + ex * Math.cos(rot) - ey * Math.sin(rot),
        p.cy + ex * Math.sin(rot) + ey * Math.cos(rot),
      ]
    }

    // ---------- ASCII 原子 ----------
    const drawAtom = (c: CanvasRenderingContext2D | null, a: AtomSpec, aliveProb: number) => {
      const orbitSize = Math.min(13, Math.max(10, a.rx * 0.26))
      for (const rot of [a.rot1, a.rot2]) {
        const steps = Math.max(12, Math.round(a.rx / 3.4))
        for (let i = 0; i < steps; i++) {
          const t = (i / steps) * Math.PI * 2
          const ex = a.rx * Math.cos(t)
          const ey = a.ry * Math.sin(t)
          const x = a.cx + ex * Math.cos(rot) - ey * Math.sin(rot)
          const y = a.cy + ex * Math.sin(rot) + ey * Math.cos(rot)
          const ch = makeChar('·', x, y, orbitSize, '#8a93a4', 0.13 + Math.random() * 0.07, aliveProb)
          field.push(ch)
          if (!ch.alive && c) drawChar(c, ch.ch, ch.x, ch.y, ch.size, ch.color, ch.alpha)
        }
      }
      const nucleus = makeChar('+', a.cx, a.cy, a.nucleusSize, '#d3d9e3', 0.42, aliveProb)
      field.push(nucleus)
      if (!nucleus.alive && c) drawChar(c, nucleus.ch, nucleus.x, nucleus.y, nucleus.size, nucleus.color, nucleus.alpha)
    }

    const atomElectronPos = (a: AtomSpec, rot: number, e: { phase: number; speed: number }, t: number): [number, number] => {
      const phase = reducedMotion ? e.phase : e.phase + t * e.speed
      const ex = a.rx * Math.cos(phase)
      const ey = a.ry * Math.sin(phase)
      return [
        a.cx + ex * Math.cos(rot) - ey * Math.sin(rot),
        a.cy + ex * Math.sin(rot) + ey * Math.cos(rot),
      ]
    }

    // ---------- 场景构建 ----------
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      for (const cv of [canvas, staticCanvas]) {
        cv.width = Math.floor(w * dpr)
        cv.height = Math.floor(h * dpr)
        cv.style.width = `${w}px`
        cv.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      staticCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)

      field = []

      // 星球：大环状行星 + 小月球
      planets = []
      const bigR = Math.min(300, Math.max(170, Math.min(w, h) * 0.29))
      planets.push({
        cx: w * 0.72,
        cy: h * 0.38,
        r: bigR,
        ringRot: -0.32,
        bandPhase: Math.random() * Math.PI * 2,
        rippleOffset: 0,
      })
      planets.push({
        cx: w * 0.15,
        cy: h * 0.76,
        r: Math.min(80, Math.max(46, Math.min(w, h) * 0.08)),
        ringRot: null,
        bandPhase: 0,
        rippleOffset: 4.5,
      })

      // ASCII 原子
      atoms = []
      const atomCount = Math.min(5, Math.max(3, Math.round((w * h) / 500000)))
      for (let i = 0; i < atomCount; i++) {
        let cx = 0
        let cy = 0
        let ok = false
        for (let tries = 0; tries < 24 && !ok; tries++) {
          cx = 60 + Math.random() * (w - 120)
          cy = 60 + Math.random() * (h - 120)
          ok = atoms.every(a => Math.hypot(a.cx - cx, a.cy - cy) > 280)
        }
        if (!ok) continue
        const rx = 30 + Math.random() * 24
        atoms.push({
          cx, cy, rx,
          ry: rx * (0.32 + Math.random() * 0.1),
          rot1: Math.random() * Math.PI,
          rot2: Math.random() * Math.PI + Math.PI / 2.6,
          nucleusSize: Math.min(17, Math.max(12, rx * 0.34)),
          e1: { phase: Math.random() * Math.PI * 2, speed: 0.2 + Math.random() * 0.1 },
          e2: { phase: Math.random() * Math.PI * 2, speed: -(0.16 + Math.random() * 0.09) },
        })
      }

      // 环卫星
      const ringed = planets[0]
      satellite = ringed.ringRot !== null
        ? { planet: ringed, k: 1.53, speed: 0.12, phase: Math.random() * Math.PI * 2 }
        : null

      // ---- 构建字符场 ----
      // 星点（全部灵动：轻微脉动）
      const cell = 46
      const cols = Math.ceil(w / cell)
      const rows = Math.ceil(h / cell)
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          if (Math.random() > 0.13) continue
          const glyph = Math.random() < 0.6 ? '·' : ['∙', '+', '°', '∗', '˙'][Math.floor(Math.random() * 5)]
          field.push(makeChar(glyph,
            gx * cell + 6 + Math.random() * (cell - 12),
            gy * cell + 6 + Math.random() * (cell - 12),
            9 + Math.random() * 5, '#9aa3b2', 0.06 + Math.random() * 0.15, 1))
        }
      }

      // 星球与环、原子（按比例灵动）
      const fontSize = Math.max(10, CELL * 0.82)
      for (const p of planets) {
        drawPlanetBody(staticCtx, p, 0.42)
        if (p.ringRot !== null) drawRing(staticCtx, p, fontSize, 0.42)
      }
      for (const a of atoms) drawAtom(staticCtx, a, 0.4)

      // 限制灵动字符数量
      aliveChars = field.filter(ch => ch.alive)
      if (aliveChars.length > ALIVE_TARGET) {
        const excess = aliveChars.length - ALIVE_TARGET
        for (let i = 0; i < excess; i++) {
          aliveChars[Math.floor(Math.random() * aliveChars.length)].alive = false
        }
        aliveChars = field.filter(ch => ch.alive)
      }

      // ---- 渲染静态层（仅静态字符） ----
      const c = staticCtx
      if (c) {
        c.clearRect(0, 0, w, h)
        for (const ch of field) {
          if (!ch.alive) drawChar(c, ch.ch, ch.x, ch.y, ch.size, ch.color, ch.alpha)
        }
      }

      // 空间索引（含全部字符；交互重绘时动态字符会被后绘覆盖，无需区分）
      grid = new Map()
      for (const ch of field) {
        const k = `${Math.floor(ch.x / FIELD_CELL)}:${Math.floor(ch.y / FIELD_CELL)}`
        const arr = grid.get(k)
        if (arr) arr.push(ch)
        else grid.set(k, [ch])
      }
    }

    // ---------- 鼠标交互 ----------
    const repelAt = (wx: number, wy: number): { f: number; px: number; py: number } => {
      const dx = wx - ptr.sx
      const dy = wy - ptr.sy
      const d = Math.hypot(dx, dy)
      let f = 0
      if (ptr.strength > 0.01 && d < INFLUENCE_R) {
        const t = 1 - d / INFLUENCE_R
        f = t * t * (3 - 2 * t) * ptr.strength
      }
      const inv = d > 0.001 ? 1 / d : 0
      return { f, px: dx * inv * PUSH * f, py: dy * inv * PUSH * f }
    }

    const drawInteraction = (ox: number, oy: number) => {
      if (ptr.strength <= 0.01) return
      const fx = ptr.sx - ox
      const fy = ptr.sy - oy
      // 清除与重绘使用同一矩形范围（按坐标过滤，不做圆形裁剪），
      // 保证边界处一一对齐，不会残留方形缺口
      ctx.clearRect(ptr.sx - CLEAR_R, ptr.sy - CLEAR_R, CLEAR_R * 2, CLEAR_R * 2)

      const gx0 = Math.floor((fx - CLEAR_R) / FIELD_CELL)
      const gx1 = Math.floor((fx + CLEAR_R) / FIELD_CELL)
      const gy0 = Math.floor((fy - CLEAR_R) / FIELD_CELL)
      const gy1 = Math.floor((fy + CLEAR_R) / FIELD_CELL)
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const arr = grid.get(`${gx}:${gy}`)
          if (!arr) continue
          for (const ch of arr) {
            if (ch.alive) continue // 灵动字符稍后统一绘制
            if (Math.abs(ch.x - fx) > CLEAR_R || Math.abs(ch.y - fy) > CLEAR_R) continue
            const { f, px, py } = repelAt(ch.x, ch.y)
            const alpha = Math.min(1, ch.alpha + 0.42 * f)
            const size = ch.size * (1 + 0.3 * f)
            const color = f > 0.55 ? '#e6ebf3' : ch.color
            drawChar(ctx, ch.ch, ch.x + ox + px, ch.y + oy + py, size, color, alpha)
          }
        }
      }
    }

    // ---------- 光波：周期性扫过星球 ----------
    const rippleBoost = (ch: FChar, t: number): number => {
      if (ch.pcx < 0) return 0
      for (const p of planets) {
        if (p.cx !== ch.pcx || p.cy !== ch.pcy) continue
        const T = 9
        const tau = (t + p.rippleOffset) % T
        if (tau > 6) return 0
        const radius = tau * 62
        const fade = Math.sin(Math.PI * (tau / 6))
        const d = Math.hypot(ch.x - p.cx, ch.y - p.cy)
        const sigma = 26
        const g = Math.exp(-((d - radius) * (d - radius)) / (2 * sigma * sigma))
        return 0.32 * fade * g
      }
      return 0
    }

    const frame = (now: number) => {
      if (!running) return
      const t = now / 1000
      ctx.clearRect(0, 0, w, h)

      if (mouse.active) {
        mouse.x += (mouse.tx - mouse.x) * 0.03
        mouse.y += (mouse.ty - mouse.y) * 0.03
      }
      const ox = mouse.x * -8
      const oy = mouse.y * -6

      if (ptr.inside) {
        ptr.sx += (ptr.x - ptr.sx) * 0.22
        ptr.sy += (ptr.y - ptr.sy) * 0.22
        if (ptr.sx < -999) { ptr.sx = ptr.x; ptr.sy = ptr.y }
      }
      ptr.strength += ((ptr.inside ? 1 : 0) - ptr.strength) * 0.07

      ctx.globalAlpha = 1
      ctx.drawImage(staticCanvas, ox, oy, w, h)
      drawInteraction(ox, oy)

      // 灵动字符：呼吸摇曳 + 脉动 + 光波 + 鼠标推离
      for (const ch of aliveChars) {
        const swayX = Math.sin(t * ch.swX + ch.swP1) * ch.swA
        const swayY = Math.cos(t * ch.swY + ch.swP2) * ch.swA
        const pulse = 0.72 + 0.28 * Math.sin(t * ch.pSpd + ch.pPh)
        const wave = rippleBoost(ch, t)

        let x = ch.x + swayX
        let y = ch.y + swayY
        let alpha = Math.min(1, ch.alpha * pulse + wave)
        let size = ch.size * (1 + wave * 0.35)

        if (ptr.strength > 0.01) {
          const { f, px, py } = repelAt(x, y)
          x += px
          y += py
          alpha = Math.min(1, alpha + 0.42 * f)
          size *= 1 + 0.3 * f
          if (f > 0.55) {
            drawChar(ctx, ch.ch, x + ox, y + oy, size, '#e6ebf3', alpha)
            continue
          }
        }
        drawChar(ctx, ch.ch, x + ox, y + oy, size, ch.color, alpha)
      }

      // 环卫星
      if (satellite) {
        const s = satellite
        const phase = reducedMotion ? s.phase : s.phase + t * s.speed
        const [x, y] = ringPoint(s.planet, s.k, phase)
        drawChar(ctx, 'o', x + ox, y + oy, 13, '#d3d9e3', 0.6)
      }

      // 电子巡游
      for (const a of atoms) {
        const eSize = Math.min(14, Math.max(11, a.rx * 0.28))
        const [x1, y1] = atomElectronPos(a, a.rot1, a.e1, t)
        drawChar(ctx, 'o', x1 + ox, y1 + oy, eSize, '#c7cdd8', 0.55)
        const [x2, y2] = atomElectronPos(a, a.rot2, a.e2, t)
        drawChar(ctx, 'o', x2 + ox, y2 + oy, eSize, '#9aa3b2', 0.5)
      }

      raf = requestAnimationFrame(frame)
    }

    const renderOnce = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = 1
      ctx.drawImage(staticCanvas, 0, 0, w, h)
      for (const ch of aliveChars) {
        drawChar(ctx, ch.ch, ch.x, ch.y, ch.size, ch.color, ch.alpha)
      }
      if (satellite) {
        const [x, y] = ringPoint(satellite.planet, satellite.k, satellite.phase)
        drawChar(ctx, 'o', x, y, 13, '#d3d9e3', 0.6)
      }
      for (const a of atoms) {
        const eSize = Math.min(14, Math.max(11, a.rx * 0.28))
        const [x1, y1] = atomElectronPos(a, a.rot1, a.e1, 0)
        drawChar(ctx, 'o', x1, y1, eSize, '#c7cdd8', 0.55)
        const [x2, y2] = atomElectronPos(a, a.rot2, a.e2, 0)
        drawChar(ctx, 'o', x2, y2, eSize, '#9aa3b2', 0.5)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      ptr.x = e.clientX
      ptr.y = e.clientY
      ptr.inside = true
      if (finePointer) {
        mouse.tx = (e.clientX / w - 0.5) * 2
        mouse.ty = (e.clientY / h - 0.5) * 2
        mouse.active = true
      }
    }

    const onPointerLeave = () => {
      ptr.inside = false
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reducedMotion) {
        running = true
        raf = requestAnimationFrame(frame)
      }
    }

    build()
    window.addEventListener('resize', build)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    if (reducedMotion) {
      renderOnce()
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
