import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuizPage } from '../components/QuizPage'
import type { Question } from '../types'

const setAnswer = vi.fn()
vi.mock('../hooks/useQuiz', () => ({
  useQuiz: () => ({
    userAnswers: { q1: 'A' }, currentIndex: 0, setCurrentIndex: vi.fn(), setAnswer,
    hasAnswer: () => true, answeredCount: 1, totalCount: 1, startQuiz: vi.fn(),
  }),
}))

const question: Question = {
  id: 'q1', type: 'single', stem: '测试问题', options: ['选项甲', '选项乙'],
  answer: 'A', explanation: '', chapter: '一', score: 100,
}

describe('quiz reactions', () => {
  it('reacts to changed answers only and submits the graded score', () => {
    const onAnswerChange = vi.fn()
    const onFinish = vi.fn()
    render(createElement(QuizPage, { questions: [question], onFinish, onAnswerChange }))
    fireEvent.click(screen.getByRole('button', { name: /选项甲/ }))
    expect(onAnswerChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /选项乙/ }))
    expect(onAnswerChange).toHaveBeenCalledTimes(1)
    expect(setAnswer).toHaveBeenCalledWith('q1', 'B')
    fireEvent.click(screen.getByRole('button', { name: '提交答卷' }))
    expect(onFinish).toHaveBeenCalledWith(expect.any(Array), 100, 100)
  })
})
