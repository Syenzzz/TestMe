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
        <div className="glass animate-rise-in relative mb-6 mt-6 overflow-hidden rounded-2xl p-8 text-center">
          {examTitle && (
            <p className="mono-label mb-2">{examTitle}</p>
          )}
          <p className="mb-3 text-sm text-white/45">你的得分</p>
          <div className="mb-2 text-6xl font-bold tracking-tight text-white">
            {displayScore}
            <span className="ml-1 text-xl font-normal text-white/40">/ {displayMax}</span>
          </div>
          <p className="mb-5 text-sm text-white/45">
            {verdict} · 正确率 {pct}%
          </p>

          {/* 统计 */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/[0.09]">
                <span className="font-mono text-2xl font-bold text-white">{correctCount}</span>
              </div>
              <span className="mt-1.5 text-xs text-white/45">正确</span>
            </div>
            {partialCount > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/18 bg-white/[0.055]">
                  <span className="font-mono text-2xl font-bold text-white/70">{partialCount}</span>
                </div>
                <span className="mt-1.5 text-xs text-white/45">部分</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <span className="font-mono text-2xl font-bold text-white/45">{wrongCount}</span>
              </div>
              <span className="mt-1.5 text-xs text-white/45">错误</span>
            </div>
          </div>
        </div>

        {/* 逐题详情 */}
        <div className="glass animate-rise-in mb-6 overflow-hidden rounded-2xl" style={{ animationDelay: '80ms' }}>
          <h3 className="border-b border-white/10 px-6 py-4 font-bold text-white/95">答题详情</h3>
          <div className="max-h-96 divide-y divide-white/[0.06] overflow-y-auto">
            {results.map((r, i) => {
              const q = getQuestion(r.questionId)
              return (
              <div
                key={r.questionId}
                className="cursor-pointer px-6 py-3 transition-colors hover:bg-white/[0.05]"
                onClick={() => setExpandedId(expandedId === r.questionId ? null : r.questionId)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${
                      r.isCorrect
                        ? 'border-white/30 bg-white/[0.1] text-white'
                        : r.isPartial
                          ? 'border-white/18 bg-white/[0.06] text-white/65'
                          : 'border-white/10 bg-white/[0.035] text-white/40'
                    }`}
                  >
                    {r.isCorrect ? '✓' : r.isPartial ? '△' : '✗'}
                  </span>
                  <span className="flex-1 truncate text-sm text-white/75">
                    <strong className="mr-1 font-mono text-white/40">{i + 1}.</strong>
                    {q?.stem || ''}
                  </span>
                  <span
                    className={`flex-shrink-0 font-mono text-sm font-bold ${
                      r.isCorrect ? 'text-white' : r.isPartial ? 'text-white/65' : 'text-white/40'
                    }`}
                  >
                    {Math.round(r.earnedScore * 100) / 100} 分
                  </span>
                </div>

                {expandedId === r.questionId && (
                  <div className="glass-soft ml-10 mt-2 space-y-1.5 rounded-xl p-3 text-xs">
                    {q && q.options.length > 0 && (
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 text-white/40">选项：</span>
                        <div className="text-white/80">
                          {q.options.map((opt, j) => (
                            <div key={j}>
                              <span className="font-medium">{LABELS[j] || `${j + 1}`}.</span> {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-white/40">你的答案：</span>
                      <span className={`font-medium ${r.isCorrect ? 'text-white' : 'text-white/55'}`}>
                        {r.userAnswer || '(未作答)'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-white/40">标准答案：</span>
                      <span className="font-medium text-white/90">{r.correctAnswer}</span>
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
              className="animate-rise-in rounded-xl border border-white/25 bg-white/[0.08] py-3.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/[0.14]"
              style={{ animationDelay: '160ms' }}
            >
              ↻ {wrongCount} 道错题已加入复习计划，返回首页开始复习
            </button>
          )}
          <div className="flex gap-3">
            {!isReviewMode && (
              <button
                onClick={onRestart}
                className="flex-1 rounded-xl bg-white py-3.5 font-semibold text-black transition-all hover:bg-white/85"
              >
                重新作答
              </button>
            )}
            <button
              onClick={onGoHome}
              className="glass-soft rounded-xl px-6 py-3.5 font-medium text-white/85 transition-all hover:bg-white/10"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
