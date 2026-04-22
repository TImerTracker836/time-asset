import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Target, AlertTriangle, Check, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeType } from '../types'
import { TodayTimeline } from '../components/TodayTimeline'
import { QuickRecord } from '../components/QuickRecord'
import { AddPlanBlock } from '../components/AddPlanBlock'

export function TodayPage() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showQuickRecord, setShowQuickRecord] = useState(false)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const {
    getEntriesByDate, getCategoryById, categories, startTimer, timer,
    getPlanByDate, togglePlanBlock, deletePlanBlock, getUnrecordedGaps,
  } = useAppStore()

  const entries = getEntriesByDate(currentDate)
  const plan = getPlanByDate(currentDate)
  const gaps = getUnrecordedGaps(currentDate)

  // 统计
  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)
  const plannedMinutes = plan?.blocks.reduce((s, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number)
    const [eh, em] = b.endTime.split(':').map(Number)
    return s + (eh * 60 + em) - (sh * 60 + sm)
  }, 0) || 0
  const completedPlanBlocks = plan?.blocks.filter((b) => b.isCompleted).length || 0
  const totalPlanBlocks = plan?.blocks.length || 0
  const planCompletionRate = totalPlanBlocks > 0 ? Math.round((completedPlanBlocks / totalPlanBlocks) * 100) : null
  const unrecordedMinutes = gaps.reduce((s, g) => s + g.minutes, 0)

  const byType = (['invest', 'maintain', 'consume'] as TimeType[]).map((type) => {
    const mins = entries
      .filter((e) => getCategoryById(e.categoryId)?.type === type)
      .reduce((s, e) => s + e.duration, 0)
    return { type, mins, pct: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0 }
  })

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="h-full flex flex-col">
      {/* 顶部日期导航 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <button
          onClick={() => setCurrentDate(format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd'))}
          className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="font-semibold">
            {isToday ? '今天' : format(new Date(currentDate), 'M月d日', { locale: zhCN })}
          </div>
          <div className="text-xs text-slate-500">
            {format(new Date(currentDate), 'yyyy年M月d日 EEEE', { locale: zhCN })}
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd'))}
          className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 摘要卡片 */}
      <div className="px-4 py-3 grid grid-cols-5 gap-2">
        <div className="bg-[#1a1a2e] rounded-xl p-3 text-center">
          <div className="text-lg font-bold font-mono">
            {Math.floor(totalMinutes / 60)}<span className="text-xs text-slate-500">h</span>
            {totalMinutes % 60 > 0 && <>{totalMinutes % 60}<span className="text-xs text-slate-500">m</span></>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">已记录</div>
        </div>
        {byType.map(({ type, mins, pct }) => {
          const cfg = TIME_TYPE_CONFIG[type]
          return (
            <div key={type} className="bg-[#1a1a2e] rounded-xl p-3 text-center">
              <div className="text-lg font-bold font-mono" style={{ color: cfg.color }}>{pct}%</div>
              <div className="text-xs text-slate-500 mt-0.5">{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* 计划完成率 + 时间黑洞预警 */}
      {(planCompletionRate !== null || unrecordedMinutes >= 30) && (
        <div className="px-4 pb-2 flex gap-2">
          {planCompletionRate !== null && (
            <div className="flex-1 bg-[#1a1a2e] rounded-xl px-3 py-2 flex items-center gap-2">
              <Target size={14} className="text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-400">计划完成</span>
              <span className="text-sm font-bold font-mono text-indigo-400">{planCompletionRate}%</span>
              <span className="text-xs text-slate-600">{completedPlanBlocks}/{totalPlanBlocks}</span>
            </div>
          )}
          {unrecordedMinutes >= 30 && (
            <div className="flex-1 bg-[#1a1a2e] rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs text-slate-400">未记录</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {unrecordedMinutes >= 60
                  ? `${Math.floor(unrecordedMinutes / 60)}h${unrecordedMinutes % 60}m`
                  : `${unrecordedMinutes}m`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 主体：时间轴 + 右侧 */}
      <div className="flex flex-1 overflow-hidden gap-3 px-4 pb-4">
        {/* 时间轴 */}
        <div className="flex-1 bg-[#0f0f1a] rounded-xl overflow-hidden">
          <TodayTimeline date={currentDate} />
        </div>

        {/* 右侧操作区 */}
        <div className="w-64 flex flex-col gap-3">
          {/* 快速启动计时 */}
          <div className="bg-[#1a1a2e] rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-2 font-medium">快速计时</div>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => !timer.isRunning && startTimer(cat.id)}
                  disabled={timer.isRunning}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: `${cat.color}22`, borderLeft: `2px solid ${cat.color}` }}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowAddPlan(true)}
              className="flex items-center justify-center gap-1.5 bg-[#1a1a2e] hover:bg-[#22224a] rounded-xl p-2.5 text-xs transition-colors border border-dashed border-[#3a3a5a] hover:border-indigo-500"
            >
              <Target size={14} />
              添加计划
            </button>
            <button
              onClick={() => setShowQuickRecord(true)}
              className="flex items-center justify-center gap-1.5 bg-[#1a1a2e] hover:bg-[#22224a] rounded-xl p-2.5 text-xs transition-colors border border-dashed border-[#3a3a5a] hover:border-indigo-500"
            >
              <Plus size={14} />
              手动记录
            </button>
          </div>

          {/* 今日计划列表 */}
          <div className="bg-[#1a1a2e] rounded-xl p-3 overflow-y-auto max-h-[30%]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-medium">今日计划 ({totalPlanBlocks})</div>
              {planCompletionRate !== null && (
                <span className="text-xs font-mono" style={{
                  color: planCompletionRate === 100 ? '#22c55e' : planCompletionRate >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {planCompletionRate}%
                </span>
              )}
            </div>
            {totalPlanBlocks === 0 ? (
              <div className="text-center text-slate-600 text-xs py-4">
                <Target size={16} className="mx-auto mb-1 opacity-50" />
                还没有计划
              </div>
            ) : (
              <div className="space-y-1.5">
                {plan?.blocks
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((block) => {
                    const cat = getCategoryById(block.categoryId)
                    return (
                      <div
                        key={block.id}
                        className={`flex items-center gap-2 p-2 rounded-lg bg-[#0f0f1a] hover:bg-[#151525] transition-colors group ${block.isCompleted ? 'opacity-50' : ''}`}
                      >
                        <button
                          onClick={() => togglePlanBlock(currentDate, block.id)}
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            block.isCompleted ? 'border-green-500 bg-green-500' : 'border-slate-600 hover:border-indigo-400'
                          }`}
                        >
                          {block.isCompleted && <Check size={10} className="text-white" />}
                        </button>
                        <span className="text-sm">{cat?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${block.isCompleted ? 'line-through text-slate-600' : ''}`}>
                            {block.title}
                          </div>
                          <div className="text-xs text-slate-600">
                            {block.startTime}-{block.endTime}
                          </div>
                        </div>
                        <button
                          onClick={() => deletePlanBlock(currentDate, block.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* 今日记录列表 */}
          <div className="flex-1 bg-[#1a1a2e] rounded-xl p-3 overflow-y-auto">
            <div className="text-xs text-slate-500 mb-2 font-medium">今日记录 ({entries.length})</div>
            {entries.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-4">还没有记录</div>
            ) : (
              <div className="space-y-1.5">
                {[...entries]
                  .sort((a, b) => b.startTime.localeCompare(a.startTime))
                  .map((entry) => {
                    const cat = getCategoryById(entry.categoryId)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-[#0f0f1a] hover:bg-[#151525] transition-colors"
                      >
                        <span className="text-base mt-0.5">{cat?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{entry.title}</div>
                          <div className="text-xs text-slate-600">
                            {format(new Date(entry.startTime), 'HH:mm')} · {entry.duration}m
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      {showQuickRecord && (
        <QuickRecord defaultDate={currentDate} onClose={() => setShowQuickRecord(false)} />
      )}
      {showAddPlan && (
        <AddPlanBlock date={currentDate} onClose={() => setShowAddPlan(false)} />
      )}
    </div>
  )
}
