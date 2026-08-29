import { useState } from 'react'
import type { Question } from '../types'
import avionicsExam from '../data/avionics-exam.json'
import structureExam from '../data/aircraft-structure-exam.json'
import engineExam from '../data/engine-exam.json'
import { shuffle } from '../utils/shuffle'
import { ReviewDashboard } from './ReviewDashboard'
import { ParticleGlobe } from './ParticleGlobe'
import { getDueReviewItems } from '../utils/spacedRepetition'

interface Props {
  onStartQuiz: (questions: Question[], title: string) => void
  onStartReview: (questions: Question[], title: string) => void
}

interface HomeworkChapter {
  index: number
  name: string
  start: number
  end: number
}

const AVIONICS_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '自动飞行系统-系统概述 自动驾驶 飞行指引 自动油门', start: 0, end: 16 },
  { index: 2, name: '导航系统-自主式导航', start: 17, end: 27 },
  { index: 3, name: '导航系统-无线电导航', start: 28, end: 43 },
  { index: 4, name: '导航系统-ADIRS 及备用仪表', start: 44, end: 57 },
  { index: 5, name: '通信系统-机上通信及应急通信设备', start: 58, end: 74 },
  { index: 6, name: '通信系统-无线电通信', start: 75, end: 91 },
  { index: 7, name: '指示与记录系统', start: 92, end: 111 },
  { index: 8, name: '自动飞行系统2', start: 112, end: 136 },
]

const STRUCTURE_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '飞机结构损伤与修理基础', start: 0, end: 9 },
  { index: 2, name: '飞机结构部件与修理准则', start: 10, end: 19 },
  { index: 3, name: '飞机结构损伤综合', start: 20, end: 29 },
  { index: 4, name: '飞机结构检查与复合材料基础', start: 30, end: 34 },
  { index: 5, name: '铆钉规范与飞机检查方法', start: 35, end: 39 },
]

const ENGINE_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '作业1', start: 0, end: 41 },
  { index: 2, name: '作业2', start: 42, end: 83 },
  { index: 3, name: '作业3', start: 84, end: 125 },
  { index: 4, name: '作业4', start: 126, end: 167 },
  { index: 5, name: '作业5', start: 168, end: 212 },
]

function ChapterCard({
  chapter,
  questionCount,
  onClick,
  highlighted = false,
  title,
  subtitle,
}: {
  chapter?: HomeworkChapter
  questionCount: number
  onClick: () => void
  highlighted?: boolean
  title: string
  subtitle?: string
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`glass-soft glass-interactive group relative cursor-pointer rounded-xl p-4
        ${highlighted ? 'border-white/30 bg-white/[0.08]' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-transform duration-300 group-hover:scale-110 ${
            highlighted
              ? 'border-white/30 bg-white/10 text-white'
              : 'border-white/12 bg-white/[0.05] text-white/60'
          }`}
        >
          {highlighted ? '✦' : chapter ? String(chapter.index).padStart(2, '0') : ''}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-snug text-white/90">{title}</h4>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="whitespace-nowrap rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-white/65">
              {subtitle ?? `${questionCount} 题`}
            </span>
          </div>
        </div>
        <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/35 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/80">
          →
        </div>
      </div>
    </div>
  )
}

function SubjectPanel({
  symbol,
  title,
  description,
  badge,
  open,
  onToggle,
  examTitle,
  examCount,
  onStartExam,
  chapters,
  questionCounts,
  onStartChapter,
  delay = 0,
}: {
  symbol: string
  title: string
  description: string
  badge: string
  open: boolean
  onToggle: () => void
  examTitle: string
  examCount: number
  onStartExam: () => void
  chapters: HomeworkChapter[]
  questionCounts: number[]
  onStartChapter: (ch: HomeworkChapter) => void
  delay?: number
}) {
  return (
    <div className="glass animate-rise-in overflow-hidden rounded-2xl" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-4 transition-colors hover:bg-white/[0.04] md:px-6"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] font-mono text-sm font-bold tracking-widest text-white/80">
            {symbol}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-base font-bold text-white/95 md:text-lg">{title}</h3>
            <p className="mt-0.5 text-xs leading-snug text-star-500 md:text-sm">{description}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span
            className="mono-label hidden whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 sm:inline-block"
            style={{ letterSpacing: '0.12em' }}
          >
            {badge}
          </span>
          <svg
            className={`h-5 w-5 flex-shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 md:px-6 md:pb-6">
          <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

          {/* 模拟考试 */}
          <div className="mb-4">
            <ChapterCard
              highlighted
              title={examTitle}
              subtitle={`${examCount} 题 · 随机排序`}
              questionCount={examCount}
              onClick={onStartExam}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {chapters.map((ch, i) => (
              <ChapterCard
                key={ch.index}
                chapter={ch}
                title={ch.name}
                questionCount={questionCounts[i]}
                onClick={() => onStartChapter(ch)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HomePage({ onStartQuiz, onStartReview }: Props) {
  const [avionicsOpen, setAvionicsOpen] = useState(true)
  const [structureOpen, setStructureOpen] = useState(true)
  const [engineOpen, setEngineOpen] = useState(true)

  const allQuestions = avionicsExam as Question[]
  const allStructureQuestions = structureExam as Question[]
  const allEngineQuestions = engineExam as Question[]

  const startHomework = (chapter: HomeworkChapter) => {
    const questions = allQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `航空电子系统 Ⅰ — 作业${chapter.index}`)
  }

  const startStructureHomework = (chapter: HomeworkChapter) => {
    const questions = allStructureQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `飞机结构与部附件修理 — 作业${chapter.index}`)
  }

  const startAvionicsExam = () => {
    const questions = shuffle(allQuestions)
    onStartQuiz(questions, `航空电子系统 Ⅰ — 模拟考试`)
  }

  const startStructureExam = () => {
    const questions = shuffle(allStructureQuestions)
    onStartQuiz(questions, `飞机结构与部附件修理 — 模拟考试`)
  }

  const startEngineHomework = (chapter: HomeworkChapter) => {
    const questions = allEngineQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `航空动力装置结构与系统 — 作业${chapter.index}`)
  }

  const startEngineExam = () => {
    const questions = shuffle(allEngineQuestions)
    onStartQuiz(questions, `航空动力装置结构与系统 — 模拟考试`)
  }

  const handleStartReview = () => {
    const dueItems = getDueReviewItems()
    const reviewQuestions = dueItems
      .map(item =>
        allQuestions.find(q => q.id === item.questionId) ||
        allStructureQuestions.find(q => q.id === item.questionId) ||
        allEngineQuestions.find(q => q.id === item.questionId)
      )
      .filter((q): q is Question => q !== undefined)

    if (reviewQuestions.length > 0) {
      onStartReview(reviewQuestions, '间隔复习')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* 顶部 Hero */}
        <header className="relative mb-12 mt-8 text-center md:mb-14 md:mt-12">
          <div className="relative">
            <ParticleGlobe />
            <p className="mono-label mb-3 mt-1">⌬ TestMe</p>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
              TestMe
            </h1>
            <p className="text-lg text-star-500">选择科目，逐题自测，自动评分</p>
          </div>
        </header>

        {/* 考试栏 */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="mono-label">// 考试栏</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/12 to-transparent" />
            <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/55">
              3 门科目
            </span>
          </div>

          <ReviewDashboard onStartReview={handleStartReview} />

          <div className="space-y-4">
            <SubjectPanel
              symbol="01"
              title="航空电子系统 Ⅰ"
              description={`共 8 次作业，合计 ${allQuestions.length} 题`}
              badge={`${AVIONICS_CHAPTERS.length} 次作业`}
              open={avionicsOpen}
              onToggle={() => setAvionicsOpen(v => !v)}
              examTitle="模拟考试"
              examCount={allQuestions.length}
              onStartExam={startAvionicsExam}
              chapters={AVIONICS_CHAPTERS}
              questionCounts={AVIONICS_CHAPTERS.map(ch => ch.end - ch.start + 1)}
              onStartChapter={startHomework}
              delay={0}
            />

            <SubjectPanel
              symbol="02"
              title="飞机结构与部附件修理"
              description={`共 5 次作业，合计 ${allStructureQuestions.length} 题`}
              badge={`${STRUCTURE_CHAPTERS.length} 次作业`}
              open={structureOpen}
              onToggle={() => setStructureOpen(v => !v)}
              examTitle="模拟考试"
              examCount={allStructureQuestions.length}
              onStartExam={startStructureExam}
              chapters={STRUCTURE_CHAPTERS}
              questionCounts={STRUCTURE_CHAPTERS.map(ch => ch.end - ch.start + 1)}
              onStartChapter={startStructureHomework}
              delay={80}
            />

            <SubjectPanel
              symbol="03"
              title="航空动力装置结构与系统"
              description={`共 5 次作业，合计 ${allEngineQuestions.length} 题`}
              badge={`${ENGINE_CHAPTERS.length} 次作业`}
              open={engineOpen}
              onToggle={() => setEngineOpen(v => !v)}
              examTitle="模拟考试"
              examCount={allEngineQuestions.length}
              onStartExam={startEngineExam}
              chapters={ENGINE_CHAPTERS}
              questionCounts={ENGINE_CHAPTERS.map(ch => ch.end - ch.start + 1)}
              onStartChapter={startEngineHomework}
              delay={160}
            />
          </div>
        </section>

        {/* 底部 */}
        <footer className="mb-8 mt-14 text-center">
          <p className="mb-2 font-mono text-[10px] tracking-[0.5em] text-white/25">· ✦ ⌬ ✦ ·</p>
          <p className="text-xs text-white/35">
            数据存储在浏览器本地，不会上传到任何服务器
          </p>
        </footer>
      </div>
    </div>
  )
}
