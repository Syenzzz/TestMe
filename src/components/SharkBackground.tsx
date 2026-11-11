import { useEffect, useRef } from 'react'
import { OceanEngine } from '../vendor/ascii-sharks/engine'

export function SharkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const ocean = new OceanEngine(canvasRef.current, [
      { kind: 'hammerhead', size: 1 },
      { kind: 'classic', size: 0.85 },
    ])
    return () => ocean.destroy()
  }, [])

  return <canvas ref={canvasRef} className="shark-background" aria-hidden="true" />
}
