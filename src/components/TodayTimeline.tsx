import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Play, Plus, Trash2, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG } from '../types'

// 今日时间轴组件
export function TodayTimeline({ date }: { date: string }) {
  const { getEntriesByDate, getCategoryById } = useAppStore()
  const entries = getEntriesByDate(date)

  // 用于时间轴位置计算（0-24h，总高度=24*60px）
  const HOUR_HEIGHT = 60 // px per hour

  const timeToY = (timeStr: string) => {
    const d = parseISO(timeStr)
    return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT
  }

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

        {/* 时间条目块 */}
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
