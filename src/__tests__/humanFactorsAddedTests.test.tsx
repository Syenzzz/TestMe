import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from '../components/HomePage'
import type { Question } from '../types'
import firstTest from '../data/human-factors-test-1.json'
import secondTest from '../data/human-factors-test-2.json'
import thirdTest from '../data/human-factors-test-3.json'

const testSets: { title: string; questions: Question[]; count: number }[] = [
  { title: '第一次测验', questions: firstTest as Question[], count: 14 },
  { title: '第二次测验', questions: secondTest as Question[], count: 32 },
  { title: '第三次测验', questions: thirdTest as Question[], count: 25 },
]

describe('人为因素与航空法规新增测验', () => {
  it('完整导入三份题目，保留答案选项和每份试卷的 100 分配分', () => {
    for (const { title, questions, count } of testSets) {
      expect(questions, title).toHaveLength(count)
      expect(questions.reduce((sum, question) => sum + question.score, 0), title).toBe(100)
      expect(new Set(questions.map(question => question.id)).size, title).toBe(count)

      for (const question of questions) {
        expect(question.stem.length, question.id).toBeGreaterThan(0)
        expect(question.score, question.id).toBeGreaterThan(0)
        expect(question.options.length, question.id).toBeGreaterThanOrEqual(2)
        for (const letter of question.answer) {
          expect(letter.charCodeAt(0) - 65, question.id).toBeLessThan(question.options.length)
        }
      }
    }
  })

  it('从课程页点击第二次测验会启动对应的 32 道原题', () => {
    const onStartQuiz = vi.fn()
    render(<HomePage onStartQuiz={onStartQuiz} />)

    fireEvent.click(screen.getByRole('button', { name: /人为因素与航空法规/ }))
    fireEvent.click(screen.getByRole('button', { name: /第二次测验/ }))

    expect(onStartQuiz).toHaveBeenCalledOnce()
    const [questions, title] = onStartQuiz.mock.calls[0]
    expect(questions).toHaveLength(32)
    expect(questions[0].stem).toContain('人为差错')
    expect(title).toBe('人为因素与航空法规 — 第二次测验')
  })
})
