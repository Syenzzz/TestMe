import { useState, useCallback, useEffect, useRef } from 'react'
import type { Question, GradingResult, AppPage } from './types'
import { HomePage } from './components/HomePage'
import { QuizPage } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'
import { CosmosBackground } from './components/CosmosBackground'
import { getDueReviewItems, recordReview } from './utils/spacedRepetition'
import type { ReviewItem } from './types'

const PAGE_HISTORY: AppPage[] = ['upload', 'quiz', 'result']

export default function App() {
  const [page, setPage] = useState<AppPage>('upload')
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [examTitle, setExamTitle] = useState('')
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])

  // 跟踪当前页面以便 popstate 时使用
  const pageRef = useRef<AppPage>(page)
  pageRef.current = page

  // 首次加载时推入初始页面状态
  useEffect(() => {
    if (window.history.state?.appPage === undefined) {
      window.history.replaceState({ appPage: 'upload' }, '', '')
    }
  }, [])

  // 监听浏览器后退/前进
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const targetPage = e.state?.appPage
      if (targetPage && PAGE_HISTORY.includes(targetPage)) {
        pageRef.current = targetPage
        setPage(targetPage)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = useCallback((newPage: AppPage) => {
    window.history.pushState({ appPage: newPage }, '', '')
    setPage(newPage)
  }, [])

  const handleStartQuiz = useCallback((q: Question[], title: string) => {
    const raw = 100 / q.length
    const perQuestion = Math.floor(raw * 100) / 100
    const remainder = Math.round((100 - perQuestion * (q.length - 1)) * 100) / 100
    const normalized = q.map((item, i) => ({
      ...item,
      score: i === q.length - 1 ? remainder : perQuestion,
    }))
    setQuestions(normalized)
    setExamTitle(title)
    navigateTo('quiz')
  }, [navigateTo])

  const handleStartReview = useCallback((q: Question[], title: string) => {
    const items = getDueReviewItems()
    const normalized = q.map((item) => ({
      ...item,
      score: 0,
    }))
    setQuestions(normalized)
    setExamTitle(title)
    setIsReviewMode(true)
    setReviewItems(items)
    navigateTo('quiz')
  }, [navigateTo])

  const handleReviewComplete = useCallback((gradingResults: GradingResult[], totalScore: number, maxScore: number, reviewQualities: { questionId: string; quality: number }[]) => {
    reviewQualities.forEach(r => recordReview(r.questionId, r.quality))
    setReviewItems([])
    setResults(gradingResults)
    setTotalScore(totalScore)
    setMaxScore(maxScore)
    navigateTo('result')
  }, [navigateTo])

  const handleFinish = useCallback((r: GradingResult[], ts: number, ms: number) => {
    setResults(r)
    setTotalScore(ts)
    setMaxScore(ms)
    navigateTo('result')
  }, [navigateTo])

  const handleRestart = useCallback(() => {
    setIsReviewMode(false)
    setReviewItems([])
    navigateTo('quiz')
  }, [navigateTo])

  const handleGoHome = useCallback(() => {
    setIsReviewMode(false)
    setReviewItems([])
    navigateTo('upload')
  }, [navigateTo])

  return (
    <div className="relative min-h-screen">
      <CosmosBackground />
      <div className="relative z-10">
        {page === 'upload' && <HomePage onStartQuiz={handleStartQuiz} onStartReview={handleStartReview} />}
        {page === 'quiz' && (
          <QuizPage
            questions={questions}
            onFinish={handleFinish}
            isReviewMode={isReviewMode}
            reviewItems={reviewItems}
            onReviewComplete={handleReviewComplete}
          />
        )}
        {page === 'result' && (
          <ResultPage
            results={results}
            totalScore={totalScore}
            maxScore={maxScore}
            questions={questions}
            examTitle={examTitle}
            isReviewMode={isReviewMode}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </div>
  )
}
