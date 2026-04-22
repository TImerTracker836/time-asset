import React, { useState } from 'react'
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, addWeeks,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeType } from '../types'

export function InsightsPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const { getEntriesByRange, getCategoryById, categories } = useAppStore()

  const baseDate = new Date()
  const weekStart = startOfWeek(subWeeks(baseDate, -weekOffset), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(subWeeks(baseDate, -weekOffset), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const entries = getEntriesByRange(
    weekStart.toISOString(),
    weekEnd.toISOString()
  )

  const totalMins = entries.reduce((s, e) => s + e.duration, 0)

  // 三类型统计
  const typeStats = (['invest', 'maintain', 'consume'] as TimeType[]).map((type) => {
    const mins = entries
      .filter((e) => getCategoryById(e.categoryId)?.type === type)
      .reduce((s, e) => s + e.duration, 0)
    const cfg = TIME_TYPE_CONFIG[type]
    return {
      type,
      name: cfg.label,
      value: mins,
      hours: (mins / 60).toFixed(1),
      pct: totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0,
      color: cfg.color,
    }
  })

  // 每日柱状图
  const dailyData = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayEntries = entries.filter((e) => e.startTime.startsWith(dateStr))
    const result: Record<string, number | string> = {
      day: format(day, 'EEE', { locale: zhCN }),
    }
    ;(['invest', 'maintain', 'consume'] as TimeType[]).forEach((type) => {
      result[type] = +(
        dayEntries
          .filter((e) => getCategoryById(e.categoryId)?.type === type)
          .reduce((s, e) => s + e.duration, 0) / 60
      ).toFixed(2)
    })
    return result
  })

  // 分类明细
  const catStats = categories.map((cat) => {
    const mins = entries
      .filter((e) => e.categoryId === cat.id)
      .reduce((s, e) => s + e.duration, 0)
    return { ...cat, mins, hours: (mins / 60).toFixed(1) }
  }).filter((c) => c.mins > 0).sort((a, b) => b.mins - a.mins)

  const isCurrentWeek = weekOffset === 0

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      {/* 周导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="font-semibold">
            {isCurrentWeek ? '本周' : `${format(weekStart, 'M月d日', { locale: zhCN })} 那周`}
          </div>
          <div className="text-xs text-slate-500">
            {format(weekStart, 'M/d', { locale: zhCN })} - {format(weekEnd, 'M/d', { locale: zhCN })}
          </div>
        </div>
        <button
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
          disabled={isCurrentWeek}
          className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#1a1a2e] rounded-xl p-3 text-center col-span-1">
          <div className="text-xl font-bold font-mono">{(totalMins / 60).toFixed(1)}</div>
          <div className="text-xs text-slate-500">总记录(h)</div>
        </div>
        {typeStats.map((t) => (
          <div key={t.type} className="bg-[#1a1a2e] rounded-xl p-3 text-center">
            <div className="text-xl font-bold font-mono" style={{ color: t.color }}>{t.hours}</div>
            <div className="text-xs text-slate-500">{t.name}(h)</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 饼图 */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          <div className="text-sm font-medium mb-3">时间组合</div>
          {totalMins === 0 ? (
            <div className="text-center text-slate-600 py-8 text-sm">暂无数据</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={typeStats.filter((t) => t.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {typeStats.map((t) => (
                      <Cell key={t.type} fill={t.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${(Number(v) / 60).toFixed(1)}h`, '']}
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around mt-1">
                {typeStats.filter((t) => t.value > 0).map((t) => (
                  <div key={t.type} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-slate-400">{t.name} {t.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 每日柱状图 */}
        <div className="bg-[#1a1a2e] rounded-xl p-4">
          <div className="text-sm font-medium mb-3">每日分布</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} barSize={10}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="h" width={28} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${v}h`]}
              />
              <Bar dataKey="invest" stackId="a" fill={TIME_TYPE_CONFIG.invest.color} name="投资" radius={[0,0,0,0]} />
              <Bar dataKey="maintain" stackId="a" fill={TIME_TYPE_CONFIG.maintain.color} name="维护" />
              <Bar dataKey="consume" stackId="a" fill={TIME_TYPE_CONFIG.consume.color} name="消耗" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 分类明细 */}
      <div className="bg-[#1a1a2e] rounded-xl p-4">
        <div className="text-sm font-medium mb-3">分类明细</div>
        {catStats.length === 0 ? (
          <div className="text-center text-slate-600 py-4 text-sm">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {catStats.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="text-lg w-6">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.name}</span>
                    <span className="font-mono text-slate-400">{cat.hours}h</span>
                  </div>
                  <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalMins > 0 ? (cat.mins / totalMins) * 100 : 0}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
