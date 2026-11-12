import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultPage } from '../components/ResultPage'
import type { Question } from '../types'
import bank from '../data/human-factors-exam.json'

describe('成绩详情', () => {
  it('在标准答案下显示对应的 PDF 原文', () => {
    const q: Question = { id: 'hf-test', type: 'single', stem: '测试题', options: ['正确内容', '其他'], answer: 'A', explanation: '', chapter: '', score: 5, sourceText: 'PDF 中的原文', sourcePage: '2' }
    render(<ResultPage questions={[q]} results={[{ questionId: q.id, isCorrect: true, isPartial: false, userAnswer: 'A', correctAnswer: 'A', earnedScore: 5, maxScore: 5 }]} totalScore={5} maxScore={5} examTitle="测试" onRestart={() => {}} onGoHome={() => {}} />)
    expect(screen.queryByText('测试题')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '第 1 题，正确' }))
    expect(screen.getByText('A 正确内容')).toBeInTheDocument()
    expect(screen.getByText('PDF 中的原文')).toBeInTheDocument()
    expect(screen.getByText(/PDF 原文/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /返回成绩总结/ }))
    expect(screen.getByRole('button', { name: '第 1 题，正确' })).toBeInTheDocument()
  })

  it('每道题关联简洁的原文，海恩法则不混入其他模型', () => {
    expect(bank).toHaveLength(87)
    for (const q of bank) {
      expect(q.sourceText.length, q.id).toBeGreaterThan(0)
      expect(q.sourceText.length, q.id).toBeLessThan(2500)
    }
    expect(bank[0].sourceText).toContain('29')
    expect(bank[0].sourceText).not.toContain('墨菲定律')
    expect(bank[0].sourceText).not.toContain('事故链理论')
    expect(bank.filter(q => q.type === 'single').every(q => !q.stem.startsWith('根据笔记，'))).toBe(true)
  })

  it('在详情页通过题号直接切换任意题', () => {
    const questions: Question[] = ['第一题', '第二题'].map((stem, i) => ({ id: String(i), type: 'single', stem, options: ['选项'], answer: 'A', explanation: '', chapter: '', score: 5 }))
    const results = questions.map((q, i) => ({ questionId: q.id, isCorrect: i === 0, isPartial: false, userAnswer: i === 0 ? 'A' : '', correctAnswer: 'A', earnedScore: i === 0 ? 5 : 0, maxScore: 5 }))
    render(<ResultPage questions={questions} results={results} totalScore={5} maxScore={10} examTitle="测试" onRestart={() => {}} onGoHome={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '第 1 题，正确' }))
    expect(screen.getByRole('heading', { name: '第一题' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '第 2 题，错误' }))
    expect(screen.getByRole('heading', { name: '第二题' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 2 题，错误' })).toHaveAttribute('aria-current', 'true')
  })
})
