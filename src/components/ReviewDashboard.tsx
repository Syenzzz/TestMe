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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] font-mono text-lg text-white/80">
            ✓
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90">全部已掌握</h3>
            <p className="text-xs text-white/45">
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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] font-mono text-lg text-white/80">
          ↻
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-bold text-white/90">今日复习</h3>
            <span className="whitespace-nowrap rounded-full border border-white/25 bg-white/[0.1] px-2 py-0.5 text-xs font-bold text-white/85">
              {stats.due} 题待复习
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] text-white/45">
            {round1 > 0 && <span className="whitespace-nowrap">L1 {round1}题 · 第1轮</span>}
            {round2Plus > 0 && <span className="whitespace-nowrap">L2 {round2Plus}题 · 巩固</span>}
            {consolidating > 0 && <span className="whitespace-nowrap">L3 {consolidating}题 · 冲刺</span>}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-white">{stats.pct}%</div>
          <div className="text-[10px] text-white/40">掌握率</div>
        </div>
      </div>
    </div>
  )
}
