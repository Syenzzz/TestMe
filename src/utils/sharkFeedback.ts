export type ScoreTier = 'excellent' | 'good' | 'steady' | 'encourage'
export type SharkReaction = ScoreTier | 'answer'

export function getScoreFeedback(totalScore: number, maxScore: number): { pct: number; tier: ScoreTier; verdict: string } {
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  if (pct >= 90) return { pct, tier: 'excellent', verdict: '表现卓越' }
  if (pct >= 70) return { pct, tier: 'good', verdict: '稳定发挥' }
  if (pct >= 50) return { pct, tier: 'steady', verdict: '继续巩固' }
  return { pct, tier: 'encourage', verdict: '再接再厉' }
}
