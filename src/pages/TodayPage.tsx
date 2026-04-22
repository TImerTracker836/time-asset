import React, { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Play, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeType } from '../types'
import { TodayTimeline } from '../components/TodayTimeline'
import { QuickRecord } from '../components/QuickRecord'

export function TodayPage() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showQuickRecord, setShowQuickRecord] = useState(false)
  const { getEntriesByDate, getCategoryById, categories, startTimer, timer } = useAppStore()

  const entries = getEntriesByDate(currentDate)

  // 统计
  const totalMinutes = entries.reduce((s, e) => s + e.duration, 0)
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
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        <div className="bg-[#1a1a2e] rounded-xl p-3 text-center">
          <div className="text-xl font-bold font-mono">
            {Math.floor(totalMinutes / 60)}
            <span className="text-xs text-slate-500 ml-0.5">h</span>
            {totalMinutes % 60 > 0 && (
              <>{totalMinutes % 60}<span className="text-xs text-slate-500 ml-0.5">m</span></>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">已记录</div>
        </div>
        {byType.map(({ type, mins, pct }) => {
          const cfg = TIME_TYPE_CONFIG[type]
          return (
            <div key={type} className="bg-[#1a1a2e] rounded-xl p-3 text-center">
              <div
                className="text-xl font-bold font-mono"
                style={{ color: cfg.color }}
              >
                {pct}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* 主体：时间轴 + 快速记录 */}
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

          {/* 手动记录按钮 */}
          <button
            onClick={() => setShowQuickRecord(true)}
            className="flex items-center justify-center gap-2 bg-[#1a1a2e] hover:bg-[#22224a] rounded-xl p-3 text-sm transition-colors border border-dashed border-[#3a3a5a] hover:border-indigo-500"
          >
            <Plus size={16} />
            手动记录时间
          </button>

          {/* 今日条目列表 */}
          <div className="flex-1 bg-[#1a1a2e] rounded-xl p-3 overflow-y-auto">
            <div className="text-xs text-slate-500 mb-2 font-medium">今日记录 ({entries.length})</div>
            {entries.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-6">还没有记录</div>
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

      {/* 手动记录弹窗 */}
      {showQuickRecord && (
        <QuickRecord
          defaultDate={currentDate}
          onClose={() => setShowQuickRecord(false)}
        />
      )}
    </div>
  )
}
