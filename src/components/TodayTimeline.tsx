import { format, parseISO } from 'date-fns'
import { AlertTriangle, Target, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG } from '../types'

const HOUR_HEIGHT = 60

const timeToY = (timeStr: string) => {
  const d = parseISO(timeStr)
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT
}

const hmToY = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  return (h + m / 60) * HOUR_HEIGHT
}

export function TodayTimeline({ date }: { date: string }) {
  const {
    getEntriesByDate, getCategoryById, getPlanByDate, getUnrecordedGaps,
    togglePlanBlock, deletePlanBlock,
  } = useAppStore()

  const entries = getEntriesByDate(date)
  const plan = getPlanByDate(date)
  const gaps = getUnrecordedGaps(date)
  const hours = Array.from({ length: 25 }, (_, i) => i)

  return (
    <div className="relative overflow-y-auto" style={{ height: '100%' }}>
      <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
        {/* 小时刻度线 */}
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start"
            style={{ top: `${h * HOUR_HEIGHT}px` }}
          >
            <span className="text-xs text-slate-600 w-10 text-right pr-2 select-none -mt-2">
              {h < 24 ? `${String(h).padStart(2, '0')}:00` : ''}
            </span>
            <div className="flex-1 border-t border-[#1e1e2e]" />
          </div>
        ))}

        {/* 计划块（半透明底色） */}
        {plan?.blocks.map((block) => {
          const cat = getCategoryById(block.categoryId)
          const top = hmToY(block.startTime)
          const [sh, sm] = block.startTime.split(':').map(Number)
          const [eh, em] = block.endTime.split(':').map(Number)
          const height = Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 20)
          return (
            <div
              key={`plan-${block.id}`}
              className="absolute left-12 right-2 rounded-md overflow-hidden"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: `${cat?.color || '#6366f1'}08`,
                borderLeft: `2px dashed ${cat?.color || '#6366f1'}66`,
              }}
            >
              <div className={`flex items-center gap-1 px-2 py-1 h-full ${block.isCompleted ? 'opacity-40' : ''}`}>
                <span className="text-sm">{cat?.icon}</span>
                <span className="text-xs text-slate-400 truncate">{block.title}</span>
                <span className="text-xs text-slate-600 shrink-0">{block.startTime}-{block.endTime}</span>
                {block.isCompleted && <Check size={12} className="text-green-500 shrink-0 ml-auto" />}
              </div>
            </div>
          )
        })}

        {/* 时间黑洞（未记录的空白段） */}
        {gaps.map((gap, i) => {
          const top = timeToY(gap.start)
          const height = Math.max((gap.minutes / 60) * HOUR_HEIGHT, 20)
          return (
            <div
              key={`gap-${i}`}
              className="absolute left-12 right-2 rounded-md flex items-center gap-1 px-2"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: 'rgba(239,68,68,0.06)',
                border: '1px dashed rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle size={12} className="text-red-500/40 shrink-0" />
              <span className="text-xs text-red-400/50">
                {gap.minutes >= 60
                  ? `${Math.floor(gap.minutes / 60)}h${gap.minutes % 60}m`
                  : `${gap.minutes}m`}
                {' '}未记录
              </span>
            </div>
          )
        })}

        {/* 实际记录块 */}
        {entries.map((entry) => {
          const cat = getCategoryById(entry.categoryId)
          const top = timeToY(entry.startTime)
          const height = Math.max((entry.duration / 60) * HOUR_HEIGHT, 20)
          const typeConfig = cat ? TIME_TYPE_CONFIG[cat.type] : null

          return (
            <div
              key={entry.id}
              className="absolute left-12 right-2 rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: typeConfig?.bg || 'rgba(99,102,241,0.15)',
                borderLeft: `3px solid ${cat?.color || '#6366f1'}`,
              }}
              title={`${entry.title} (${entry.duration}分钟)`}
            >
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="text-xs">{cat?.icon}</span>
                <span className="text-xs font-medium truncate">{entry.title}</span>
                {height > 35 && (
                  <span className="text-xs text-slate-500 ml-auto shrink-0">{entry.duration}m</span>
                )}
              </div>
              {height > 48 && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {format(parseISO(entry.startTime), 'HH:mm')} - {format(parseISO(entry.endTime), 'HH:mm')}
                </div>
              )}
            </div>
          )
        })}

        {/* 当前时间线 */}
        {date === format(new Date(), 'yyyy-MM-dd') && (() => {
          const now = new Date()
          const y = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
          return (
            <div
              className="absolute left-10 right-0 flex items-center pointer-events-none"
              style={{ top: `${y}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <div className="flex-1 border-t border-red-500 border-dashed" />
            </div>
          )
        })()}
      </div>
    </div>
  )
}
