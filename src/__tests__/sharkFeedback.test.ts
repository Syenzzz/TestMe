import { createElement, createRef } from 'react'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getScoreFeedback } from '../utils/sharkFeedback'
import { SharkBackground } from '../components/SharkBackground'
import type { SharkBackgroundHandle } from '../components/SharkBackground'

const engine = vi.hoisted(() => ({ react: vi.fn(), destroy: vi.fn() }))
vi.mock('../vendor/ascii-sharks/engine', () => ({
  OceanEngine: class {
    react = engine.react
    destroy = engine.destroy
  },
}))

describe('score feedback', () => {
  it.each([
    [90, 'excellent', '表现卓越'],
    [89.9, 'good', '稳定发挥'],
    [70, 'good', '稳定发挥'],
    [69.9, 'steady', '继续巩固'],
    [50, 'steady', '继续巩固'],
    [49.9, 'encourage', '再接再厉'],
  ] as const)('maps %s%% to the matching result', (score, tier, verdict) => {
    expect(getScoreFeedback(score, 100)).toEqual({ pct: score, tier, verdict })
  })

  it('uses the displayed rounded percentage and handles zero maximum', () => {
    expect(getScoreFeedback(89.96, 100).tier).toBe('excellent')
    expect(getScoreFeedback(0, 0)).toEqual({ pct: 0, tier: 'encourage', verdict: '再接再厉' })
  })
})

describe('shark reactions', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('limits rapid answer reactions and distinguishes score tiers', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const ref = createRef<SharkBackgroundHandle>()
    const view = render(createElement(SharkBackground, { ref }))
    ref.current!.react('answer')
    ref.current!.react('answer')
    vi.advanceTimersByTime(800)
    ref.current!.react('answer')
    expect(engine.react.mock.calls.map(call => call[0])).toEqual([12, 12])

    engine.react.mockClear()
    for (const tier of ['excellent', 'good', 'steady', 'encourage'] as const) ref.current!.react(tier)
    const strengths = engine.react.mock.calls.map(call => call[0] as number)
    expect(strengths).toHaveLength(4)
    expect(strengths[0]).toBeGreaterThan(strengths[1])
    expect(strengths[1]).toBeGreaterThan(strengths[2])
    expect(strengths[2]).toBeGreaterThan(strengths[3])
    expect(strengths[3]).toBeGreaterThan(0)
    view.unmount()
    expect(engine.destroy).toHaveBeenCalled()
  })
})
