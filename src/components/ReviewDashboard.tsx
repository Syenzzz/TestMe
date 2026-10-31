import { getReviewSnapshot } from '../utils/spacedRepetition'

interface Props {
  onStartReview: () => void
}

export function ReviewDashboard({ onStartReview }: Props) {
  const { dueItems, stats } = getReviewSnapshot()

  // Count items by review round (single pass)
  const { round1, round2Plus, consolidating } = dueItems.reduce(
    (acc, r) => {
      if (r.repetitions === 0) acc.round1++
      else if (r.repetitions < 4) acc.round2Plus++
      else acc.consolidating++
      return acc
    },
    { round1: 0, round2Plus: 0, consolidating: 0 }
  )

  // No reviews at all → don't show
  if (stats.total === 0) return null

  // No due reviews → collapsed state
  if (stats.due === 0) {
    return (
      <div className="glass mb-6 overflow-hidden rounded-2xl">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 font-serif text-lg text-emerald-700">
            ✓
          </div>
          <div>
            <h3 className="text-base font-medium text-claude-ink">全部已掌握</h3>
            <p className="mt-0.5 text-xs text-claude-faint">
              {stats.mastered} 题已掌握 · 复习队列 {stats.total} 题
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onStartReview}
      className="glass glass-interactive mb-6 cursor-pointer overflow-hidden rounded-2xl"
    >
      <div className="flex items-center gap-4 px-6 py-5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-claude-terracotta/20 bg-claude-terracotta-soft font-serif text-lg text-claude-terracotta">
          ↻
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-medium text-claude-ink">今日复习</h3>
            <span className="whitespace-nowrap rounded-full bg-claude-terracotta-soft px-2.5 py-0.5 text-xs font-medium text-claude-terracotta">
              {stats.due} 题待复习
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-claude-faint">
            {round1 > 0 && <span className="whitespace-nowrap">L1 {round1} 题 · 第 1 轮</span>}
            {round2Plus > 0 && <span className="whitespace-nowrap">L2 {round2Plus} 题 · 巩固</span>}
            {consolidating > 0 && <span className="whitespace-nowrap">L3 {consolidating} 题 · 冲刺</span>}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-serif text-2xl font-medium text-claude-ink">{stats.pct}%</div>
          <div className="text-[10px] text-claude-faint">掌握率</div>
        </div>
      </div>
    </div>
  )
}
