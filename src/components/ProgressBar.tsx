interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-claude-sand">
      <div
        className="h-full rounded-full bg-claude-terracotta transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
