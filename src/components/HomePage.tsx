import { useState } from 'react'
import type { Question } from '../types'
import avionicsExam from '../data/avionics-exam.json'
import structureExam from '../data/aircraft-structure-exam.json'
import engineExam from '../data/engine-exam.json'
import humanFactorsExam from '../data/human-factors-exam.json'
import healthMonitoringExam from '../data/health-monitoring-exam.json'
import { shuffle } from '../utils/shuffle'

interface Props {
  onStartQuiz: (questions: Question[], title: string) => void
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

const HEALTH_MONITORING_CHAPTERS: HomeworkChapter[] = [
  { index: 1, name: '作业五（贝叶斯诊断计算）', start: 0, end: 0 },
  { index: 2, name: '故障树化简练习题', start: 1, end: 1 },
  { index: 3, name: '第二章作业', start: 2, end: 11 },
  { index: 4, name: '项目三 综合测验1——故障树诊断方法', start: 12, end: 26 },
  { index: 5, name: '空调系统健康监测与故障诊断（作业六）', start: 27, end: 31 },
  { index: 6, name: '引气系统健康监测与故障诊断（作业七）', start: 32, end: 36 },
]

function ChapterCard({
  chapter,
  number,
  questionCount,
  onClick,
  highlighted = false,
  title,
  subtitle,
}: {
  chapter?: HomeworkChapter
  number?: number
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
      className={`group relative cursor-pointer rounded-xl p-4 transition-all duration-200
        ${highlighted
          ? 'border border-claude-terracotta bg-claude-terracotta hover:bg-claude-terracotta-dark'
          : 'glass-soft glass-interactive'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border font-serif text-sm font-medium transition-transform duration-300 group-hover:scale-110 ${
            highlighted
              ? 'border-white/25 bg-white/15 text-white'
              : 'border-claude-border bg-claude-canvas text-claude-muted'
          }`}
        >
          {highlighted ? '✦' : chapter || number !== undefined ? String(chapter?.index ?? number).padStart(2, '0') : ''}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-semibold leading-snug ${highlighted ? 'text-white' : 'text-claude-ink'}`}>{title}</h4>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              highlighted
                ? 'border-white/25 bg-white/15 text-white/85'
                : 'border-claude-border bg-claude-canvas text-claude-muted'
            }`}>
              {subtitle ?? `${questionCount} 题`}
            </span>
          </div>
        </div>
        <div className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-0.5 ${
          highlighted ? 'text-white/85' : 'text-claude-faint group-hover:text-claude-terracotta'
        }`}>
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
        className="flex w-full items-center justify-between gap-2 px-5 py-5 transition-colors hover:bg-claude-canvas md:px-7"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-claude-border bg-claude-canvas font-serif text-base font-medium tracking-widest text-claude-muted">
            {symbol}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-lg font-medium text-claude-ink md:text-xl">{title}</h3>
            <p className="mt-1 text-sm leading-snug text-claude-muted">{description}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span
            className="hidden whitespace-nowrap rounded-full border border-claude-border bg-claude-canvas px-2.5 py-1 text-[11px] font-medium tracking-wide text-claude-faint sm:inline-block"
          >
            {badge}
          </span>
          <svg
            className={`h-5 w-5 flex-shrink-0 text-claude-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-6 md:px-7 md:pb-7">
          <div className="mb-5 h-px bg-claude-border-soft" />

          {/* 模拟考试 */}
          <div className="mb-3.5">
            <ChapterCard
              highlighted
              title={examTitle}
              subtitle={`${examCount} 题 · 随机排序`}
              questionCount={examCount}
              onClick={onStartExam}
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
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

export function HomePage({ onStartQuiz }: Props) {
  const [pastOpen, setPastOpen] = useState(false)
  const [avionicsOpen, setAvionicsOpen] = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)
  const [engineOpen, setEngineOpen] = useState(false)
  const [humanFactorsOpen, setHumanFactorsOpen] = useState(false)
  const [healthMonitoringOpen, setHealthMonitoringOpen] = useState(false)

  const allQuestions = avionicsExam as Question[]
  const allStructureQuestions = structureExam as Question[]
  const allEngineQuestions = engineExam as Question[]
  const allHealthMonitoringQuestions = healthMonitoringExam as Question[]
  const humanFactorsGroups = Array.from({ length: 5 }, (_, group) =>
    (humanFactorsExam as Question[]).filter((_, index) => index % 5 === group),
  )
  const totalQuestions = allQuestions.length + allStructureQuestions.length + allEngineQuestions.length

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

  const startHealthMonitoringHomework = (chapter: HomeworkChapter) => {
    const questions = allHealthMonitoringQuestions.slice(chapter.start, chapter.end + 1)
    onStartQuiz(questions, `健康监测与故障诊断 — ${chapter.name}`)
  }

  const startHealthMonitoringExam = () => {
    const questions = shuffle(allHealthMonitoringQuestions)
    onStartQuiz(questions, `健康监测与故障诊断 — 模拟考试`)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        {/* 顶部 Hero */}
        <header className="relative mb-12 mt-4 border-b border-claude-border-soft pb-10 md:mt-8">
          <div className="mb-5 flex items-center gap-2.5">
            <svg
              className="h-5 w-5 text-claude-terracotta"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5.5v13M5.5 12h13M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6" />
              <g fill="currentColor" stroke="none">
                <circle cx="12" cy="3.5" r="1.6" />
                <circle cx="12" cy="20.5" r="1.6" />
                <circle cx="3.5" cy="12" r="1.6" />
                <circle cx="20.5" cy="12" r="1.6" />
                <circle cx="6" cy="6" r="1.6" />
                <circle cx="18" cy="18" r="1.6" />
                <circle cx="18" cy="6" r="1.6" />
                <circle cx="6" cy="18" r="1.6" />
                <circle cx="12" cy="12" r="1.2" />
              </g>
            </svg>
            <span className="text-sm font-medium tracking-wide text-claude-muted">TestMe</span>
          </div>
          <h1 className="mb-4 text-5xl font-medium tracking-[-0.02em] text-claude-ink md:text-7xl">
            TestMe
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-claude-muted">
            航空课程题库，选择科目，逐题自测，自动评分。
          </p>
        </header>

        {/* 现有课程 */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-base font-medium text-claude-ink">现有课程</h2>
            <div className="h-px flex-1 bg-claude-border-soft" />
            <span className="rounded-full border border-claude-border bg-claude-surface px-2.5 py-0.5 text-xs text-claude-muted">
              本学期
            </span>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <button className="flex w-full items-center justify-between px-5 py-5 text-left md:px-7" onClick={() => setHumanFactorsOpen(v => !v)} aria-expanded={humanFactorsOpen}>
              <span><span className="block text-lg font-medium text-claude-ink">人为因素与航空法规</span><span className="mt-1 block text-sm text-claude-muted">重点练习 · {humanFactorsExam.length} 题 · 5 组</span></span>
              <span className="text-claude-muted">{humanFactorsOpen ? '收起' : '展开'}</span>
            </button>
            {humanFactorsOpen && <div className="grid gap-3 px-5 pb-6 sm:grid-cols-2 md:px-7">
              {humanFactorsGroups.map((group, index) => <ChapterCard key={index} number={index + 1} title={`第 ${index + 1} 组`} questionCount={group.length} onClick={() => onStartQuiz(shuffle(group), `人为因素与航空法规 — 第 ${index + 1} 组`)} />)}
            </div>}
          </div>

          <div className="glass mt-10 overflow-hidden rounded-2xl">
            <button className="flex w-full items-center justify-between px-5 py-5 text-left md:px-7" onClick={() => setHealthMonitoringOpen(v => !v)} aria-expanded={healthMonitoringOpen}>
              <span><span className="block text-lg font-medium text-claude-ink">健康监测与故障诊断</span><span className="mt-1 block text-sm text-claude-muted">按作业练习 · {allHealthMonitoringQuestions.length} 题 · {HEALTH_MONITORING_CHAPTERS.length} 次作业</span></span>
              <span className="text-claude-muted">{healthMonitoringOpen ? '收起' : '展开'}</span>
            </button>
            {healthMonitoringOpen && <div className="px-5 pb-6 md:px-7">
              <div className="mb-3.5">
                <ChapterCard
                  highlighted
                  title="模拟考试"
                  subtitle={`${allHealthMonitoringQuestions.length} 题 · 随机排序`}
                  questionCount={allHealthMonitoringQuestions.length}
                  onClick={startHealthMonitoringExam}
                />
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {HEALTH_MONITORING_CHAPTERS.map(ch => <ChapterCard
                  key={ch.index}
                  chapter={ch}
                  title={ch.name}
                  questionCount={allHealthMonitoringQuestions.slice(ch.start, ch.end + 1).length}
                  onClick={() => startHealthMonitoringHomework(ch)}
                />)}
              </div>
            </div>}
          </div>

          <div className="glass mt-10 overflow-hidden rounded-2xl">
            <button
              onClick={() => setPastOpen(v => !v)}
              aria-expanded={pastOpen}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-claude-canvas md:px-6"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-claude-border bg-claude-canvas text-claude-muted">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-base font-medium text-claude-ink">往期课程</h3>
                  <p className="mt-0.5 text-xs text-claude-faint">
                    3 门科目 · 共 {totalQuestions} 题
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="hidden rounded-full border border-claude-border bg-claude-canvas px-2.5 py-0.5 text-[11px] text-claude-faint sm:inline-block">
                  3 门
                </span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-claude-muted transition-transform duration-200 ${pastOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {pastOpen && (
              <div className="border-t border-claude-border-soft bg-claude-canvas/25 p-3 md:p-4">
                <div className="space-y-3">
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
              </div>
            )}
          </div>
        </section>

        {/* 底部 */}
        <footer className="mb-8 mt-16 border-t border-claude-border-soft pt-6 text-center">
          <p className="text-xs text-claude-faint">
            数据保存在浏览器本地，不会上传到服务器
          </p>
        </footer>
      </div>
    </div>
  )
}
