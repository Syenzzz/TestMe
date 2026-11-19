import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { normalizeQuizScores } from '../utils/normalizeQuizScores'

function question(id: string, score: number): Question {
  return { id, type: 'single', stem: id, options: ['正确', '错误'], answer: 'A', explanation: '', chapter: '', score }
}

describe('normalizeQuizScores', () => {
  it('题库原本合计 100 分时保留每题的原始分值', () => {
    const source = [question('a', 8), question('b', 6), question('c', 86)]
    expect(normalizeQuizScores(source)).toEqual(source)
    expect(normalizeQuizScores(source).map(item => item.score)).toEqual([8, 6, 86])
  })

  it('题库合计不是 100 分时仍按原行为均分到 100 分', () => {
    const normalized = normalizeQuizScores([question('a', 5), question('b', 5), question('c', 5)])
    expect(normalized.map(item => item.score)).toEqual([33.33, 33.33, 33.34])
    expect(normalized.reduce((sum, item) => sum + item.score, 0)).toBe(100)
  })

  it('空题单不进行除零操作', () => {
    expect(normalizeQuizScores([])).toEqual([])
  })
})
