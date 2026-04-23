import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

interface AddPlanBlockProps {
  date: string
  onClose: () => void
}

export function AddPlanBlock({ date, onClose }: AddPlanBlockProps) {
  const { categories, addPlanBlock } = useAppStore()
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')

  const duration = (() => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()

  const handleSave = () => {
    if (!title.trim() || !categoryId || duration <= 0) return
    addPlanBlock(date, { title: title.trim(), categoryId, startTime, endTime })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-md shadow-[var(--shadow-modal)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h3 className="font-semibold">添加计划</h3>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">计划内容 *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：上午深度工作"
              className="w-full bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">时间类别 *</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                  style={
                    categoryId === cat.id
                      ? { backgroundColor: cat.color, color: 'white' }
                      : { backgroundColor: `${cat.color}22`, color: 'var(--text-secondary)', border: `1px solid ${cat.color}44` }
                  }
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2 text-sm outline-none focus:border-accent text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2 text-sm outline-none focus:border-accent text-text-primary"
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="text-center text-sm">
              <span className="text-text-muted">计划时长：</span>
              <span className="font-mono font-bold text-accent">
                {duration >= 60 ? `${Math.floor(duration / 60)}h${duration % 60}m` : `${duration}m`}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 border border-border-secondary rounded-xl py-2.5 text-sm hover:border-text-tertiary transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !categoryId || duration <= 0}
            className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-2.5 text-sm font-medium text-white transition-colors"
          >
            添加计划
          </button>
        </div>
      </div>
    </div>
  )
}
