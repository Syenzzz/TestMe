export type QuestionType = 'single' | 'multiple' | 'true-false' | 'fill-blank' | 'short-answer'

export interface Question {
  id: string
  type: QuestionType
  /** 题干 */
  stem: string
  /** 选项列表（简答题为 []） */
  options: string[]
  /** 标准答案 */
  answer: string
  /** 解析（可选） */
  explanation: string
  /** 原始学习资料的文字及 PDF 页码 */
  sourceText?: string
  sourcePage?: string
  /** 所属章节 */
  chapter: string
  /** 分值，默认 5 */
  score: number
}

export interface GradingResult {
  questionId: string
  isCorrect: boolean
  /** 部分得分 */
  isPartial: boolean
  userAnswer: string
  correctAnswer: string
  earnedScore: number
  maxScore: number
  /** 简答题关键词覆盖率 */
  coverage?: number
}

export interface QuizSession {
  questions: Question[]
  userAnswers: Record<string, string>
  currentIndex: number
  startTime: number
  submitted: boolean
}

export interface QuizHistory {
  date: string
  totalScore: number
  maxScore: number
  correctCount: number
  totalCount: number
  results: GradingResult[]
}

export interface ReviewItem {
  questionId: string
  efactor: number
  interval: number
  repetitions: number
  nextReview: string
  lastReview: string
  lastQuality: number
  mastered: boolean
}

export type AppPage = 'upload' | 'quiz' | 'result'
