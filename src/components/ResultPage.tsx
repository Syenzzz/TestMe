import { useState, useEffect, useRef } from 'react'
import type { GradingResult, Question } from '../types'
import { saveHistory } from '../utils/storage'
import { getScoreFeedback } from '../utils/sharkFeedback'

interface Props {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  questions: Question[]
  examTitle: string
  onRestart: () => void
  onGoHome: () => void
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function ResultPage({ results, totalScore, maxScore, questions, examTitle, onRestart, onGoHome }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const savedRef = useRef(false)

  const displayScore = Math.round(totalScore * 100) / 100
  const displayMax = Math.round(maxScore * 100) / 100
  const { pct, verdict } = getScoreFeedback(totalScore, maxScore)
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  // Side effect: save history (once)
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getQuestion = (id: string) => questions.find(qq => qq.id === id)

  if (selectedIndex !== null) {
    const result = results[selectedIndex]
    const question = getQuestion(result.questionId)
    const answerText = question && (question.type === 'single' || question.type === 'multiple')
      ? `${result.correctAnswer} ${result.correctAnswer.split('').map(letter => question.options[LABELS.indexOf(letter)]).filter(Boolean).join('、')}`
      : result.correctAnswer
    return (
      <div className="min-h-screen px-3 py-6 sm:px-4 sm:py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-[72px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
        <aside aria-label="题号导航" className="glass sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto p-2 sm:p-4">
          <h2 className="mb-3 text-center text-xs font-medium text-claude-muted sm:text-left sm:text-sm">题号</h2>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {results.map((item, index) => (
              <button
                type="button"
                key={item.questionId}
                aria-label={`第 ${index + 1} 题，${item.isCorrect ? '正确' : item.isPartial ? '部分正确' : '错误'}`}
                aria-current={index === selectedIndex ? 'true' : undefined}
                onClick={() => setSelectedIndex(index)}
                className={`aspect-square min-h-7 rounded-md border text-xs font-semibold sm:min-h-10 sm:text-sm ${item.isCorrect ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : item.isPartial ? 'border-claude-terracotta/30 bg-claude-terracotta-soft text-claude-terracotta' : 'border-red-200 bg-red-50 text-red-700'} ${index === selectedIndex ? 'ring-2 ring-claude-ink ring-offset-1' : ''}`}
              >{index + 1}</button>
            ))}
          </div>
        </aside>
        <main className="min-w-0">
          <button onClick={() => setSelectedIndex(null)} className="mb-5 text-sm font-medium text-claude-muted hover:text-claude-ink">← 返回成绩总结</button>
          <div className="glass p-6 md:p-8">
            <p className="mb-3 text-sm text-claude-muted">第 {selectedIndex + 1} 题 / {results.length} · {result.isCorrect ? '正确' : result.isPartial ? '部分正确' : '错误'} · {Math.round(result.earnedScore * 100) / 100} 分</p>
            <h2 className="mb-6 text-xl leading-relaxed text-claude-ink">{question?.stem}</h2>
            {question && question.options.length > 0 && <div className="mb-6 space-y-2 text-sm text-claude-body">{question.options.map((option, index) => <p key={index}>{LABELS[index]}. {option}</p>)}</div>}
            <div className="space-y-5 border-t border-claude-border-soft pt-5 text-sm leading-relaxed">
              <div><p className="mb-1 text-claude-faint">你的答案</p><p className="whitespace-pre-wrap text-claude-body">{result.userAnswer || '未作答'}</p></div>
              <div><p className="mb-1 text-claude-faint">标准答案</p><p className="whitespace-pre-wrap font-medium text-claude-ink">{answerText}</p></div>
              {question?.sourceText && <div><p className="mb-1 text-claude-faint">PDF 原文{question.sourcePage ? `（第 ${question.sourcePage} 页）` : ''}</p><p className="whitespace-pre-wrap text-claude-body">{question.sourceText}</p></div>}
            </div>
          </div>
          <div className="mt-5 flex justify-between gap-3">
            <button disabled={selectedIndex === 0} onClick={() => setSelectedIndex(selectedIndex - 1)} className="rounded-lg border border-claude-border px-4 py-2 text-sm disabled:opacity-40">← 上一题</button>
            <button disabled={selectedIndex === results.length - 1} onClick={() => setSelectedIndex(selectedIndex + 1)} className="rounded-lg border border-claude-border px-4 py-2 text-sm disabled:opacity-40">下一题 →</button>
          </div>
        </main>
        </div>
      </div>
    )
  }

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
          <div className="grid grid-cols-5 gap-3 p-6 sm:grid-cols-8">
            {results.map((r, i) => {
              return (
              <button
                type="button"
                key={r.questionId}
                aria-label={`第 ${i + 1} 题，${r.isCorrect ? '正确' : r.isPartial ? '部分正确' : '错误'}`}
                className={`aspect-square rounded-lg border text-sm font-semibold transition-colors ${r.isCorrect ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : r.isPartial ? 'border-claude-terracotta/30 bg-claude-terracotta-soft text-claude-terracotta' : 'border-red-200 bg-red-50 text-red-700'}`}
                onClick={() => setSelectedIndex(i)}
              >
                {i + 1}
              </button>
            )})}
          </div>
        </div>

        {/* 操作 */}
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 rounded-xl bg-claude-terracotta py-3.5 font-semibold text-white transition-all hover:bg-claude-terracotta-dark"
            >
              重新作答
            </button>
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
