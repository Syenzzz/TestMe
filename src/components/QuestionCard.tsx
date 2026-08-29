import type { Question } from '../types'

interface Props {
  question: Question
  userAnswer: string
  onAnswer: (answer: string) => void
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  'single':       { label: '单选题' },
  'multiple':     { label: '多选题' },
  'true-false':   { label: '判断题' },
  'fill-blank':   { label: '填空题' },
  'short-answer': { label: '简答题' },
}

function OptionButton({
  letter,
  text,
  isSelected,
  onClick,
  showCheck = false,
}: {
  letter: string
  text: string
  isSelected: boolean
  onClick: () => void
  showCheck?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-xl border transition-all duration-200 ${
        isSelected
          ? 'border-white/80 bg-white/[0.14]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
      } px-5 py-3.5`}
    >
      <span
        className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
          isSelected
            ? 'border-white bg-white text-black'
            : 'border-white/15 bg-white/[0.05] text-white/50 group-hover:border-white/30'
        }`}
      >
        {showCheck && isSelected ? '✓' : letter}
      </span>
      <span className={isSelected ? 'font-medium text-white' : 'text-white/75'}>{text}</span>
    </button>
  )
}

export function QuestionCard({ question, userAnswer, onAnswer }: Props) {
  const cfg = TYPE_CONFIG[question.type]

  if (question.type === 'single' || question.type === 'true-false') {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-white/70">
            {cfg.label}
          </span>
          <span className="font-mono text-xs text-white/40">{question.score} 分</span>
        </div>
        <p className="mb-6 text-lg font-semibold leading-relaxed text-white/95">{question.stem}</p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            return (
              <OptionButton
                key={letter}
                letter={letter}
                text={opt}
                isSelected={userAnswer === letter}
                onClick={() => onAnswer(letter)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'multiple') {
    const selectedSet = new Set((userAnswer || '').toUpperCase().split('').filter(Boolean))

    const toggleOption = (letter: string) => {
      const newSet = new Set(selectedSet)
      if (newSet.has(letter)) newSet.delete(letter)
      else newSet.add(letter)
      onAnswer([...newSet].sort().join(''))
    }

    return (
      <div>
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-white/70">
            {cfg.label}
          </span>
          <span className="font-mono text-xs text-white/40">{question.score} 分</span>
          <span className="ml-auto rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-xs text-white/50">
            多选
          </span>
        </div>
        <p className="mb-6 text-lg font-semibold leading-relaxed text-white/95">{question.stem}</p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            return (
              <OptionButton
                key={letter}
                letter={letter}
                text={opt}
                isSelected={selectedSet.has(letter)}
                onClick={() => toggleOption(letter)}
                showCheck
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'fill-blank' || question.type === 'short-answer') {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded-lg border border-white/15 bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-white/70">
            {cfg.label}
          </span>
          <span className="font-mono text-xs text-white/40">{question.score} 分</span>
        </div>
        <p className="mb-6 text-lg font-semibold leading-relaxed text-white/95">{question.stem}</p>
        <textarea
          value={userAnswer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder={question.type === 'fill-blank' ? '输入答案...' : '输入你的回答...'}
          rows={question.type === 'short-answer' ? 5 : 2}
          className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-white placeholder:text-white/30 transition-all focus:border-white/50 focus:bg-white/[0.08] focus:outline-none"
        />
      </div>
    )
  }

  return null
}
