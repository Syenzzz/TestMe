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
      className={`group rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
        isSelected
          ? 'border-claude-terracotta bg-claude-terracotta-soft'
          : 'border-claude-border bg-claude-raised hover:border-claude-terracotta/40 hover:bg-claude-canvas'
      }`}
    >
      <span
        className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
          isSelected
            ? 'border-claude-terracotta bg-claude-terracotta text-white'
            : 'border-claude-border bg-claude-canvas text-claude-muted group-hover:border-claude-border'
        }`}
      >
        {showCheck && isSelected ? '✓' : letter}
      </span>
      <span className={isSelected ? 'font-medium text-claude-ink' : 'text-claude-body'}>{text}</span>
    </button>
  )
}

export function QuestionCard({ question, userAnswer, onAnswer }: Props) {
  const cfg = TYPE_CONFIG[question.type]

  if (question.type === 'single' || question.type === 'true-false') {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded-full border border-claude-border bg-claude-canvas px-2.5 py-1 text-xs font-medium text-claude-muted">
            {cfg.label}
          </span>
          <span className="text-xs tabular-nums text-claude-faint">{question.score} 分</span>
        </div>
        <p className="mb-7 font-serif text-xl font-medium leading-[1.75] text-claude-ink">{question.stem}</p>
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
          <span className="rounded-full border border-claude-border bg-claude-canvas px-2.5 py-1 text-xs font-medium text-claude-muted">
            {cfg.label}
          </span>
          <span className="text-xs tabular-nums text-claude-faint">{question.score} 分</span>
          <span className="ml-auto rounded-full bg-claude-sand/60 px-2 py-0.5 text-xs text-claude-muted">
            多选
          </span>
        </div>
        <p className="mb-7 font-serif text-xl font-medium leading-[1.75] text-claude-ink">{question.stem}</p>
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
          <span className="rounded-full border border-claude-border bg-claude-canvas px-2.5 py-1 text-xs font-medium text-claude-muted">
            {cfg.label}
          </span>
          <span className="text-xs tabular-nums text-claude-faint">{question.score} 分</span>
        </div>
        <p className="mb-7 font-serif text-xl font-medium leading-[1.75] text-claude-ink">{question.stem}</p>
        <textarea
          value={userAnswer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder={question.type === 'fill-blank' ? '输入答案...' : '输入你的回答...'}
          rows={question.type === 'short-answer' ? 5 : 2}
          className="w-full resize-none rounded-xl border border-claude-border bg-claude-raised px-4 py-3.5 text-claude-ink placeholder:text-claude-faint transition-all focus:border-claude-terracotta focus:outline-none focus:ring-2 focus:ring-claude-terracotta/15"
        />
      </div>
    )
  }

  return null
}
