import { useState, useCallback, useRef } from 'react'
import type { Question, GradingResult, ReviewItem } from '../types'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'
import { useQuiz } from '../hooks/useQuiz'
import { gradeAll } from '../utils/grading'
import { clearProgress } from '../utils/storage'

interface Props {
  questions: Question[]
  onFinish: (results: GradingResult[], totalScore: number, maxScore: number) => void
  isReviewMode?: boolean
  reviewItems?: ReviewItem[]
  onReviewComplete?: (gradingResults: GradingResult[], totalScore: number, maxScore: number, reviewQualities: { questionId: string; quality: number }[]) => void
}

export function QuizPage({ questions, onFinish, isReviewMode = false, reviewItems = [], onReviewComplete }: Props) {
  const {
    userAnswers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    hasAnswer,
    answeredCount,
    totalCount,
    startQuiz,
  } = useQuiz()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const initialized = useRef(false)

  if (!initialized.current && questions.length > 0) {
    startQuiz(questions)
    initialized.current = true
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const isFirst = currentIndex === 0

  const goNext = useCallback(() => {
    if (isLast) {
      const unanswered = questions.filter(q => !hasAnswer(q.id)).length
      if (unanswered > 0) {
        setShowSubmitConfirm(true)
      } else {
        handleSubmit()
      }
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }, [isLast, currentIndex, questions, hasAnswer])

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentIndex(currentIndex - 1)
  }, [isFirst, currentIndex])

  const handleSubmit = useCallback(() => {
    const { results, totalScore, maxScore } = gradeAll(questions, userAnswers)
    clearProgress()
    onFinish(results, totalScore, maxScore)
  }, [questions, userAnswers, onFinish])

  const handleReviewSubmit = useCallback(() => {
    if (!onReviewComplete) return
    const { results, totalScore, maxScore } = gradeAll(questions, userAnswers)
    const qualities = questions.map(q => ({
      questionId: q.id,
      quality: 3,
    }))
    clearProgress()
    onReviewComplete(results, totalScore, maxScore, qualities)
  }, [questions, userAnswers, onReviewComplete])

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">没有题目</p>
      </div>
    )
  }

  const unanswered = questions.filter(q => !hasAnswer(q.id)).length
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0
  const currentReviewItem = isReviewMode
    ? reviewItems.find(r => r.questionId === currentQuestion.id)
    : null

  return (
    <div className="flex min-h-screen">
      {/* 桌面端可折叠侧边栏 */}
      <aside
        className={`glass sticky top-0 hidden h-screen flex-shrink-0 overflow-hidden rounded-none border-y-0 border-l-0 transition-all duration-300 md:block ${
          sidebarOpen ? 'w-60' : 'w-12'
        }`}
      >
        {sidebarOpen ? (
          <div className="flex h-full flex-col p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="mono-label" style={{ letterSpacing: '0.18em' }}>答题卡</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-claude-muted transition-colors hover:bg-claude-canvas hover:text-claude-ink"
              >
                ◀
              </button>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-claude-sand">
                <div
                  className="h-full rounded-full bg-claude-terracotta transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const answered = hasAnswer(q.id)
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-7 w-7 flex-shrink-0 rounded-lg text-xs font-medium tabular-nums transition-all ${
                        isCurrent
                          ? 'scale-110 border border-claude-terracotta bg-claude-terracotta text-white'
                          : answered
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border border-claude-border bg-claude-canvas text-claude-muted hover:bg-claude-sand'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 flex gap-4 border-t border-claude-border-soft pt-2 text-[10px] text-claude-faint">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> 已答</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-claude-sand" /> 未答</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-2 pt-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-claude-muted transition-colors hover:bg-claude-canvas hover:text-claude-ink"
              title="展开答题卡"
            >
              ▶
            </button>
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-20 w-8 overflow-hidden rounded-full bg-claude-sand">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-full bg-claude-terracotta transition-all duration-500"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-claude-faint">{answeredCount}</span>
            </div>
          </div>
        )}
      </aside>

      {/* 主答题区 */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4 md:p-8">
        {/* 顶部信息栏 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium tabular-nums text-claude-faint">
              <span className="text-claude-ink">{String(currentIndex + 1).padStart(2, '0')}</span>
              <span className="text-claude-faint"> / {totalCount}</span>
            </span>
            <span className="hidden text-xs text-claude-faint sm:inline">已答 {answeredCount} 题</span>
          </div>
          <button
            onClick={() => setShowMobileSheet(true)}
            className="glass-soft rounded-lg px-3 py-1.5 text-xs tabular-nums text-claude-muted transition-colors hover:bg-claude-canvas md:hidden"
          >
            答题卡 {answeredCount}/{totalCount}
          </button>
        </div>

        <ProgressBar current={currentIndex} total={totalCount} />

        {currentReviewItem && (
          <div className="mb-3 mt-4 flex items-center gap-2">
            <span className="rounded-full border border-claude-terracotta/20 bg-claude-terracotta-soft px-2.5 py-1 text-xs font-medium text-claude-terracotta">
              ↻ 第 {currentReviewItem.repetitions + 1} 轮复习
            </span>
            <span className="text-xs text-claude-faint">
              上次复习: {currentReviewItem.lastReview}
            </span>
          </div>
        )}

        {/* 题目卡片 */}
        <div className="mt-5 flex-1">
          <div className="glass animate-rise-in rounded-2xl p-6 transition-all md:p-8" key={currentQuestion.id}>
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id] || ''}
              onAnswer={answer => setAnswer(currentQuestion.id, answer)}
            />
          </div>
        </div>

        {/* 底部导航 */}
        <div className="mt-5 flex items-center justify-between pb-4">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
              isFirst
                ? 'cursor-not-allowed border-transparent text-claude-faint/50'
                : 'border-claude-border bg-claude-surface text-claude-body hover:bg-claude-canvas'
            }`}
          >
            ← 上一题
          </button>

          {isLast ? (
            <button
              onClick={isReviewMode ? handleReviewSubmit : goNext}
              className="rounded-xl bg-claude-terracotta px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-claude-terracotta-dark hover:shadow-md"
            >
              {isReviewMode ? '完成复习' : '提交答卷'}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="rounded-xl bg-claude-terracotta px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-claude-terracotta-dark hover:shadow-md"
            >
              下一题 →
            </button>
          )}
        </div>
      </main>

      {/* 移动端答题卡 */}
      {showMobileSheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-claude-ink/30 backdrop-blur-sm" onClick={() => setShowMobileSheet(false)} />
          <div className="glass absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-b-0 p-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-claude-sand" />
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-medium text-claude-ink">{isReviewMode ? '复习进度' : '答题卡'}</span>
              <span className="text-sm tabular-nums text-claude-faint">{answeredCount}/{totalCount} 已答</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const answered = hasAnswer(q.id)
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowMobileSheet(false) }}
                    className={`h-10 w-10 rounded-lg text-xs font-medium tabular-nums transition-all ${
                      isCurrent
                        ? 'border border-claude-terracotta bg-claude-terracotta text-white'
                        : answered
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border border-claude-border bg-claude-canvas text-claude-muted'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 提交确认 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-claude-ink/30 backdrop-blur-sm" onClick={() => setShowSubmitConfirm(false)} />
          <div className="glass relative w-full max-w-sm rounded-2xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-claude-terracotta/20 bg-claude-terracotta-soft font-serif text-2xl font-medium text-claude-terracotta">
              !
            </div>
            <h3 className="mb-2 text-xl font-medium text-claude-ink">确认提交</h3>
            <p className="mb-6 text-sm text-claude-muted">
              还有 <span className="font-semibold text-claude-ink">{unanswered}</span> 题未作答<br />提交后将计为 0 分
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 rounded-xl border border-claude-border bg-claude-surface py-2.5 text-sm font-medium text-claude-body transition-colors hover:bg-claude-canvas"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-claude-terracotta py-2.5 text-sm font-semibold text-white transition-all hover:bg-claude-terracotta-dark"
              >
                确定提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
