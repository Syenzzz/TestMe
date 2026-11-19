import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from '../components/HomePage'
import { ResultPage } from '../components/ResultPage'
import type { Question } from '../types'
import bank from '../data/health-monitoring-exam.json'

describe('健康监测新题库', () => {
  it('按原文件分为六组，保留题型、参考答案及原文说明', () => {
    expect(bank).toHaveLength(37)
    expect(Array.from({ length: 6 }, (_, i) => bank.filter(q => q.chapter === `${i + 1}号`).length)).toEqual([5, 4, 5, 9, 5, 9])
    expect(new Set(bank.map(q => q.id)).size).toBe(37)
    for (const q of bank) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.answer, q.id).toMatch(/^[A-D]+$/)
      expect(q.sourceText, q.id).toBeTruthy()
    }
    expect(bank.filter(q => q.answerLabel === '参考答案')).toHaveLength(5)
    expect(bank.find(q => q.id === 'health-v2-4-7')?.sourceText).toContain('不宜作为所有Pt100产品的通用温度范围')
  })

  it('六组可以独立开始，按来源而非打散分组', () => {
    const onStartQuiz = vi.fn()
    render(<HomePage onStartQuiz={onStartQuiz} />)
    fireEvent.click(screen.getByRole('button', { name: /健康监测与故障诊断/ }))
    expect(screen.getByText('第 6 次测试')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /第 3 次测试/ }))
    const [questions] = onStartQuiz.mock.calls[0] as [Question[], string]
    expect(questions).toHaveLength(5)
    expect(questions.every(q => q.chapter === '3号')).toBe(true)
  })

  it('交卷详情将参考答案和题库原文分别标识', () => {
    const q = bank.find(item => item.id === 'health-v2-3-1') as Question
    render(<ResultPage questions={[q]} results={[{ questionId: q.id, isCorrect: true, isPartial: false, userAnswer: 'B', correctAnswer: 'B', earnedScore: 5, maxScore: 5 }]} totalScore={5} maxScore={5} examTitle="测试" onRestart={() => {}} onGoHome={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '第 1 题，正确' }))
    expect(screen.getByText('参考答案')).toBeInTheDocument()
    expect(screen.getByText('题库原文')).toBeInTheDocument()
    expect(screen.getByText(/措辞不够严谨/)).toBeInTheDocument()
  })

  it('判断题的正确答案同时显示选项内容', () => {
    const q = bank.find(item => item.id === 'health-v2-1-5') as Question
    render(<ResultPage questions={[q]} results={[{ questionId: q.id, isCorrect: true, isPartial: false, userAnswer: 'A', correctAnswer: 'A', earnedScore: 5, maxScore: 5 }]} totalScore={5} maxScore={5} examTitle="测试" onRestart={() => {}} onGoHome={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '第 1 题，正确' }))
    expect(screen.getByText('A 对')).toBeInTheDocument()
  })

})
