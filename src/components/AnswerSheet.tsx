import type { Question } from '../types'

interface Props {
  questions: Question[]
  currentIndex: number
  hasAnswer: (id: string) => boolean
  onJump: (index: number) => void
  onClose?: () => void  // for mobile drawer
}

export function AnswerSheet({ questions, currentIndex, hasAnswer, onJump, onClose }: Props) {
  const answeredCount = questions.filter(q => hasAnswer(q.id)).length

  return (
    <div className="bg-emerald-700 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">答题卡</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none md:hidden">
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {answeredCount} / {questions.length} 已答
      </p>
      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        {questions.map((q, i) => {
          const answered = hasAnswer(q.id)
          const isCurrent = i === currentIndex
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={`w-9 h-9 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                isCurrent
                  ? 'bg-blue-500 text-slate-900 ring-2 ring-blue-300'
                  : answered
                    ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 已答
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 inline-block" /> 未答
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 当前
        </span>
      </div>
    </div>
  )
}
