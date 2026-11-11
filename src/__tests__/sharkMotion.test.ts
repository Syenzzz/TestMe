import { describe, expect, it, vi } from 'vitest'
import { OceanEngine } from '../vendor/ascii-sharks/engine'
import { World } from '../vendor/ascii-sharks/world'

describe('shark motion', () => {
  it('increases swimming speed and caps repeated reactions', () => {
    const world = new World([{ kind: 'classic', size: 1 }], 0)
    world.resize(800, 600, 8, 16)
    const before = world.sharks[0].speed
    world.react(20)
    expect(world.sharks[0].speed).toBe(before + 20)
    world.react(1000)
    expect(world.sharks[0].speed).toBe(150)
  })

  it('does not trigger reactions when reduced motion is requested', () => {
    const react = vi.fn()
    const engine = Object.assign(Object.create(OceanEngine.prototype) as object, {
      reducedMotion: { matches: true },
      world: { react },
    }) as unknown as OceanEngine
    engine.react(65)
    expect(react).not.toHaveBeenCalled()
  })
})
