import type { Question } from '../types'

export function normalizeQuizScores(questions: Question[]): Question[] {
  if (questions.length === 0) return questions

  const sourceTotal = questions.reduce((sum, question) => sum + question.score, 0)
  if (Math.abs(sourceTotal - 100) < 0.005) return questions

  const perQuestion = Math.floor((100 / questions.length) * 100) / 100
  const remainder = Math.round((100 - perQuestion * (questions.length - 1)) * 100) / 100
  return questions.map((question, index) => ({
    ...question,
    score: index === questions.length - 1 ? remainder : perQuestion,
  }))
}
