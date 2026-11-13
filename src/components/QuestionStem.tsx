export function QuestionStem({ stem }: { stem: string }) {
  const formatted = stem.replace(/(。)(?=请(?:完成|绘制|回答|计算|分析))/g, '$1\n')
  const lines = formatted.split(/\n+/).map(line => line.trim()).filter(Boolean)
  const questionStart = lines.findIndex((line, index) => index > 0 && /^请(?:完成|绘制|回答|计算|分析|简述|说明)/.test(line))
  const background = questionStart < 0 ? lines : lines.slice(0, questionStart)
  const prompts = questionStart < 0 ? [] : lines.slice(questionStart)
  return (
    <div className="mb-7 space-y-4 font-serif text-lg leading-[1.85] text-claude-ink sm:text-xl">
      {background.map((line, index) => <p key={index} className="whitespace-pre-wrap break-words">{line}</p>)}
      {prompts.length > 0 && <div className="space-y-3 border-t border-claude-border pt-4">{prompts.map((line, index) => <p key={index} className="whitespace-pre-wrap break-words">{line}</p>)}</div>}
    </div>
  )
}
