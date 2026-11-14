import { describe, expect, it } from 'vitest'
import bank from '../data/aircraft-maintenance-review.json'

describe('飞机维修学习资料题库', () => {
  it('题量与题目编号', () => {
    expect(bank).toHaveLength(80)
    bank.forEach((q, index) => {
      expect(q.id).toBe(`amr-${index + 1}`)
    })
  })

  it('全部为四选项单选题，答案为单个字母', () => {
    for (const q of bank) {
      expect(q.type, q.id).toBe('single')
      expect(q.options, q.id).toHaveLength(4)
      expect(/^[A-D]$/.test(q.answer), `${q.id}: ${q.answer}`).toBe(true)
      expect(q.score, q.id).toBeGreaterThan(0)
    }
    expect(new Set(bank.map(q => q.id)).size).toBe(bank.length)
  })
})
