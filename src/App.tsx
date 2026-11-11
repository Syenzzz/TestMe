import { useState, useCallback, useEffect, useRef } from 'react'
import type { Question, GradingResult, AppPage } from './types'
import { HomePage } from './components/HomePage'
import { QuizPage } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'
import { SharkBackground } from './components/SharkBackground'
import type { SharkBackgroundHandle } from './components/SharkBackground'
import { getScoreFeedback } from './utils/sharkFeedback'

const PAGE_HISTORY: AppPage[] = ['upload', 'quiz', 'result']

export default function App() {
  const [page, setPage] = useState<AppPage>('upload')
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [examTitle, setExamTitle] = useState('')
  const sharkRef = useRef<SharkBackgroundHandle>(null)

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

  const handleFinish = useCallback((r: GradingResult[], ts: number, ms: number) => {
    sharkRef.current?.react(getScoreFeedback(ts, ms).tier)
    setResults(r)
    setTotalScore(ts)
    setMaxScore(ms)
    navigateTo('result')
  }, [navigateTo])

  const handleRestart = useCallback(() => {
    navigateTo('quiz')
  }, [navigateTo])

  const handleGoHome = useCallback(() => {
    navigateTo('upload')
  }, [navigateTo])

  return (
    <div className="relative min-h-screen">
      <SharkBackground ref={sharkRef} />
      <div className="relative z-10">
        {page === 'upload' && <HomePage onStartQuiz={handleStartQuiz} />}
        {page === 'quiz' && (
          <QuizPage
            questions={questions}
            onFinish={handleFinish}
            onAnswerChange={() => sharkRef.current?.react('answer')}
          />
        )}
        {page === 'result' && (
          <ResultPage
            results={results}
            totalScore={totalScore}
            maxScore={maxScore}
            questions={questions}
            examTitle={examTitle}
            onRestart={handleRestart}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </div>
  )
}
