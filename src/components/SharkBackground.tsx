import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import { OceanEngine } from '../vendor/ascii-sharks/engine'
import type { SharkReaction } from '../utils/sharkFeedback'

export interface SharkBackgroundHandle {
  react: (reaction: SharkReaction) => void
}

const REACTION_STRENGTH: Record<SharkReaction, number> = {
  answer: 12,
  excellent: 65,
  good: 48,
  steady: 32,
  encourage: 20,
}

export function SharkBackground({ ref }: { ref: Ref<SharkBackgroundHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OceanEngine | null>(null)
  const lastAnswerReaction = useRef(0)

  useImperativeHandle(ref, () => ({
    react(reaction) {
      const now = Date.now()
      if (reaction === 'answer' && now - lastAnswerReaction.current < 800) return
      if (reaction === 'answer') lastAnswerReaction.current = now
      engineRef.current?.react(REACTION_STRENGTH[reaction])
    },
  }), [])

  useEffect(() => {
    if (!canvasRef.current) return
    const ocean = new OceanEngine(canvasRef.current, [
      { kind: 'hammerhead', size: 1 },
      { kind: 'classic', size: 0.85 },
    ])
    engineRef.current = ocean
    return () => {
      engineRef.current = null
      ocean.destroy()
    }
  }, [])

  return <canvas ref={canvasRef} className="shark-background" aria-hidden="true" />
}
