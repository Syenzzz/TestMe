import { useState, useEffect, useRef } from 'react'
import type { GradingResult, Question } from '../types'
import { saveHistory } from '../utils/storage'
import { enqueueReview } from '../utils/spacedRepetition'

interface Props {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  questions: Question[]
  examTitle: string
  isReviewMode?: boolean
  onRestart: () => void
  onGoHome: () => void
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function ResultPage({ results, totalScore, maxScore, questions, examTitle, isReviewMode = false, onRestart, onGoHome }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const savedRef = useRef(false)

  const displayScore = Math.round(totalScore * 100) / 100
  const displayMax = Math.round(maxScore * 100) / 100
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  // Side effects: save history + enqueue wrong answers (once)
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    saveHistory({
      date: new Date().toLocaleDateString('zh-CN'),
      totalScore: displayScore,
      maxScore: displayMax,
      correctCount,
      totalCount: results.length,
      results,
    })
    if (!isReviewMode) {
      const wrongIds = results.filter(r => !r.isCorrect).map(r => r.questionId)
      wrongIds.forEach(id => enqueueReview(id))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getQuestion = (id: string) => questions.find(qq => qq.id === id)

  const verdict = pct >= 90 ? '表现卓越' : pct >= 70 ? '稳定发挥' : pct >= 50 ? '继续巩固' : '再接再厉'

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        {/* 总分卡片 */}
        <div className="glass animate-rise-in relative mb-6 mt-6 overflow-hidden rounded-2xl p-10 text-center">
          {examTitle && (
            <p className="mono-label mb-2">{examTitle}</p>
          )}
          <p className="mb-3 text-sm text-claude-faint">你的得分</p>
          <div className="mb-2 font-serif text-7xl font-medium tracking-tight text-claude-ink">
            {displayScore}
            <span className="ml-2 text-xl font-normal text-claude-faint">/ {displayMax}</span>
          </div>
          <p className="mb-6 text-sm text-claude-muted">
            {verdict} · 正确率 {pct}%
          </p>

          {/* 统计 */}
          <div className={`mx-auto grid max-w-sm gap-3 ${partialCount > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded-xl border border-claude-border bg-claude-canvas px-3 py-3">
              <div className="font-serif text-2xl font-medium text-emerald-700">{correctCount}</div>
              <span className="mt-0.5 block text-xs text-claude-faint">正确</span>
            </div>
            {partialCount > 0 && (
              <div className="rounded-xl border border-claude-border bg-claude-canvas px-3 py-3">
                <div className="font-serif text-2xl font-medium text-claude-terracotta">{partialCount}</div>
                <span className="mt-0.5 block text-xs text-claude-faint">部分</span>
              </div>
            )}
            <div className="rounded-xl border border-claude-border bg-claude-canvas px-3 py-3">
              <div className="font-serif text-2xl font-medium text-claude-crimson">{wrongCount}</div>
              <span className="mt-0.5 block text-xs text-claude-faint">错误</span>
            </div>
          </div>
        </div>

        {/* 逐题详情 */}
        <div className="glass animate-rise-in mb-6 overflow-hidden rounded-2xl" style={{ animationDelay: '80ms' }}>
          <h3 className="border-b border-claude-border-soft px-6 py-4 text-base font-medium text-claude-ink">答题详情</h3>
          <div className="max-h-96 divide-y divide-claude-border-soft overflow-y-auto">
            {results.map((r, i) => {
              const q = getQuestion(r.questionId)
              return (
              <div
                key={r.questionId}
                className="cursor-pointer px-6 py-3 transition-colors hover:bg-claude-canvas"
                onClick={() => setExpandedId(expandedId === r.questionId ? null : r.questionId)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-medium ${
                      r.isCorrect
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : r.isPartial
                          ? 'border-claude-terracotta/20 bg-claude-terracotta-soft text-claude-terracotta'
                          : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {r.isCorrect ? '✓' : r.isPartial ? '△' : '✗'}
                  </span>
                  <span className="flex-1 truncate text-sm text-claude-body">
                    <strong className="mr-1 tabular-nums text-claude-faint">{i + 1}.</strong>
                    {q?.stem || ''}
                  </span>
                  <span
                    className={`flex-shrink-0 text-sm font-semibold tabular-nums ${
                      r.isCorrect ? 'text-claude-ink' : r.isPartial ? 'text-claude-terracotta' : 'text-claude-crimson'
                    }`}
                  >
                    {Math.round(r.earnedScore * 100) / 100} 分
                  </span>
                </div>

                {expandedId === r.questionId && (
                  <div className="ml-10 mt-2 space-y-1.5 rounded-xl border border-claude-border-soft bg-claude-canvas p-3 text-xs">
                    {q && q.options.length > 0 && (
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 text-claude-faint">选项：</span>
                        <div className="text-claude-body">
                          {q.options.map((opt, j) => (
                            <div key={j}>
                              <span className="font-medium">{LABELS[j] || `${j + 1}`}.</span> {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-claude-faint">你的答案：</span>
                      <span className={`font-medium ${r.isCorrect ? 'text-claude-ink' : 'text-claude-body'}`}>
                        {r.userAnswer || '(未作答)'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-claude-faint">标准答案：</span>
                      <span className="font-medium text-claude-body">{r.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* 操作 */}
        <div className="mb-10 flex flex-col gap-3">
          {!isReviewMode && wrongCount > 0 && (
            <button
              onClick={onGoHome}
              className="animate-rise-in rounded-xl border border-claude-border bg-claude-canvas py-3.5 text-sm font-medium text-claude-body transition-all hover:bg-claude-sand"
              style={{ animationDelay: '160ms' }}
            >
              ↻ {wrongCount} 道错题已加入复习计划，返回首页开始复习
            </button>
          )}
          <div className="flex gap-3">
            {!isReviewMode && (
              <button
                onClick={onRestart}
                className="flex-1 rounded-xl bg-claude-terracotta py-3.5 font-semibold text-white transition-all hover:bg-claude-terracotta-dark"
              >
                重新作答
              </button>
            )}
            <button
              onClick={onGoHome}
              className="rounded-xl border border-claude-border bg-claude-surface px-6 py-3.5 font-medium text-claude-body transition-all hover:bg-claude-canvas"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
