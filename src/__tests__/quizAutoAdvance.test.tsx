import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuizPage } from '../components/QuizPage'
import type { Question } from '../types'

const question = (id: string, type: Question['type']): Question => ({
  id, type, stem: `题目 ${id}`, options: ['选项甲', '选项乙'], answer: 'A', explanation: '', chapter: '', score: 5,
})

describe('单选自动跳题', () => {
  beforeEach(() => localStorage.clear())

  it('单选后前进并保存答案，多选停留，最后一题不自动提交', () => {
    const onFinish = vi.fn()
    render(<QuizPage questions={[question('1', 'single'), question('2', 'multiple'), question('3', 'single')]} onFinish={onFinish} onAnswerChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /选项甲/ }))
    expect(screen.getByText('题目 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /选项甲/ }))
    expect(screen.getByText('题目 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /上一题/ }))
    expect(screen.getByText('题目 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }))
    fireEvent.click(screen.getByRole('button', { name: /下一题/ }))
    fireEvent.click(screen.getByRole('button', { name: /选项乙/ }))
    expect(screen.getByText('题目 3')).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '提交答卷' }))
    expect(onFinish).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ questionId: '1', userAnswer: 'A' }), expect.objectContaining({ questionId: '2', userAnswer: 'A' }), expect.objectContaining({ questionId: '3', userAnswer: 'B' })]), expect.any(Number), expect.any(Number))
  })
})
