import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Play, Square, X, Clock } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

interface TimerBarProps {
  onSave: () => void
}

export function TimerBar({ onSave }: TimerBarProps) {
  const { timer, categories, startTimer, stopTimer, cancelTimer, tickTimer, getCategoryById } = useAppStore()
  const [title, setTitle] = useState('')
  const [showSave, setShowSave] = useState(false)

  useEffect(() => {
    if (!timer.isRunning) return
    const id = setInterval(tickTimer, 1000)
    return () => clearInterval(id)
  }, [timer.isRunning, tickTimer])

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const currentCat = timer.categoryId ? getCategoryById(timer.categoryId) : null

  if (timer.isRunning) {
    if (showSave) {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-secondary p-4 z-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{currentCat?.icon}</span>
              <span className="text-sm text-text-secondary">{currentCat?.name}</span>
              <span className="ml-auto font-mono text-accent font-bold">{formatElapsed(timer.elapsed)}</span>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="刚才做了什么？"
                className="flex-1 bg-bg-tertiary border border-border-secondary rounded-lg px-3 py-2 text-sm outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) {
                    stopTimer(title.trim())
                    setTitle('')
                    setShowSave(false)
                    onSave()
                  }
                }}
              />
              <button
                onClick={() => {
                  if (title.trim()) {
                    stopTimer(title.trim())
                    setTitle('')
                    setShowSave(false)
                    onSave()
                  }
                }}
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowSave(false)}
                className="border border-border-secondary px-3 py-2 rounded-lg text-sm transition-colors hover:border-accent"
              >
                继续
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-secondary z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-4 px-4 py-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentCat?.color || 'var(--accent)' }}
          />
          <span className="text-2xl">{currentCat?.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-medium">{currentCat?.name}</div>
            <div className="text-xs text-text-muted">
              {timer.startTime && format(new Date(timer.startTime), 'HH:mm', { locale: zhCN })} 开始
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-accent">{formatElapsed(timer.elapsed)}</span>
          <button
            onClick={() => setShowSave(true)}
            className="bg-accent hover:bg-accent-hover text-white p-2.5 rounded-full transition-colors"
            title="停止计时"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => { cancelTimer(); setShowSave(false) }}
            className="text-text-tertiary hover:text-danger p-2 transition-colors"
            title="取消"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    )
  }

  return null
}
