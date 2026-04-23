import React, { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Trash2, Edit2, Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeEntry } from '../types'
import { QuickRecord } from '../components/QuickRecord'

export function HistoryPage() {
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const { entries, getCategoryById, deleteEntry } = useAppStore()

  const grouped = entries
    .slice()
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
    .reduce<Record<string, TimeEntry[]>>((acc, e) => {
      const date = e.startTime.substring(0, 10)
      if (!acc[date]) acc[date] = []
      acc[date].push(e)
      return acc
    }, {})

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
        <h2 className="font-semibold">历史记录</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          补录
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center text-text-muted py-16">还没有任何记录</div>
        )}
        {Object.entries(grouped).map(([date, dayEntries]) => {
          const dayTotal = dayEntries.reduce((s, e) => s + e.duration, 0)
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  {format(new Date(date), 'M月d日 EEEE', { locale: zhCN })}
                </span>
                <span className="text-xs text-text-muted ml-auto">
                  共 {Math.floor(dayTotal / 60)}h{dayTotal % 60}m
                </span>
              </div>
              <div className="space-y-1.5">
                {dayEntries.map((entry) => {
                  const cat = getCategoryById(entry.categoryId)
                  const typeCfg = cat ? TIME_TYPE_CONFIG[cat.type] : null
                  return (
                    <div key={entry.id} className="flex items-center gap-3 bg-bg-card rounded-xl px-3 py-2.5 group shadow-[var(--shadow-card)]">
                      <span className="text-xl">{cat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{entry.title}</span>
                          {typeCfg && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
                            >
                              {typeCfg.label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {format(new Date(entry.startTime), 'HH:mm')} →{' '}
                          {format(new Date(entry.endTime), 'HH:mm')}
                          <span className="ml-2 font-mono">{entry.duration}m</span>
                          {entry.note && <span className="ml-2 text-text-tertiary">· {entry.note}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('确定删除这条记录？')) deleteEntry(entry.id) }}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-text-tertiary hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && <QuickRecord defaultDate={format(new Date(), 'yyyy-MM-dd')} onClose={() => setShowAdd(false)} />}
      {editEntry && <QuickRecord defaultDate={editEntry.startTime.substring(0, 10)} prefill={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  )
}
