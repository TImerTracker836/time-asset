import React, { useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeEntry } from '../types'

interface QuickRecordProps {
  defaultDate: string
  onClose: () => void
  prefill?: Partial<TimeEntry>
}

export function QuickRecord({ defaultDate, onClose, prefill }: QuickRecordProps) {
  const { categories, addEntry } = useAppStore()
  const [title, setTitle] = useState(prefill?.title || '')
  const [categoryId, setCategoryId] = useState(prefill?.categoryId || categories[0]?.id || '')
  const [startTime, setStartTime] = useState(
    prefill?.startTime
      ? format(new Date(prefill.startTime), "yyyy-MM-dd'T'HH:mm")
      : `${defaultDate}T${format(new Date(), 'HH:mm')}`
  )
  const [endTime, setEndTime] = useState(
    prefill?.endTime
      ? format(new Date(prefill.endTime), "yyyy-MM-dd'T'HH:mm")
      : `${defaultDate}T${format(new Date(), 'HH:mm')}`
  )
  const [note, setNote] = useState(prefill?.note || '')

  const duration = Math.max(
    Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000),
    0
  )

  const handleSave = () => {
    if (!title.trim() || !categoryId || duration <= 0) return
    addEntry({
      title: title.trim(),
      categoryId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
      note: note.trim() || undefined,
      isPlanned: false,
    })
    onClose()
  }

  const groupedCats = (['invest', 'maintain', 'consume'] as const).map((type) => ({
    type,
    cats: categories.filter((c) => c.type === type),
  }))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a4a]">
          <h3 className="font-semibold">记录时间</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">做了什么 *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：阅读《原则》第三章"
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 分类选择 */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">时间类别 *</label>
            <div className="space-y-2">
              {groupedCats.map(({ type, cats }) => {
                const cfg = TIME_TYPE_CONFIG[type]
                return (
                  <div key={type}>
                    <div className="text-xs mb-1" style={{ color: cfg.color }}>
                      {cfg.label} · {cfg.desc}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategoryId(cat.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                          style={
                            categoryId === cat.id
                              ? { backgroundColor: cat.color, color: 'white' }
                              : { backgroundColor: `${cat.color}22`, color: '#94a3b8', border: `1px solid ${cat.color}44` }
                          }
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 时间段 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">开始时间</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">结束时间</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* 时长显示 */}
          {duration > 0 && (
            <div className="text-center text-sm">
              <span className="text-slate-500">时长：</span>
              <span className="font-mono font-bold text-indigo-400">
                {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}
              </span>
            </div>
          )}

          {/* 备注 */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="收获、想法、反思…"
              rows={2}
              className="w-full bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 border border-[#2a2a4a] rounded-xl py-2.5 text-sm hover:border-slate-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !categoryId || duration <= 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            保存记录
          </button>
        </div>
      </div>
    </div>
  )
}
