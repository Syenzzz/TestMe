import { describe, expect, it } from 'vitest'
import bank from '../data/health-monitoring-exam.json'

describe('健康监测与故障诊断题库', () => {
  it('题量与章节分组顺序', () => {
    expect(bank).toHaveLength(37)
    expect(Array.from(new Set(bank.map(q => q.chapter)))).toEqual([
      '作业五',
      '故障树化简练习题',
      '第二章作业',
      '项目三 综合测验1——故障树诊断方法',
      '空调系统健康监测与故障诊断（作业六）',
      '引气系统健康监测与故障诊断（作业七）',
    ])
  })

  it('题目 id 唯一，题干、答案与分值齐全', () => {
    expect(new Set(bank.map(q => q.id)).size).toBe(bank.length)
    for (const q of bank) {
      expect(q.stem.length, q.id).toBeGreaterThan(0)
      expect(q.answer.length, q.id).toBeGreaterThan(0)
      expect(q.score, q.id).toBeGreaterThan(0)
    }
  })

  it('客观题答案为字母选项，主观题不带选项', () => {
    for (const q of bank) {
      if (q.type === 'single' || q.type === 'multiple' || q.type === 'true-false') {
        expect(q.options.length, q.id).toBeGreaterThanOrEqual(2)
        expect(/^[A-F]+$/.test(q.answer), `${q.id}: ${q.answer}`).toBe(true)
      } else {
        expect(q.options, q.id).toHaveLength(0)
      }
    }
  })
})
