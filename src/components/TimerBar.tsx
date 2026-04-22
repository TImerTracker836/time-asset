import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Play, Square, X, Clock } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG } from '../types'

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
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-[#2a2a4a] p-4 z-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{currentCat?.icon}</span>
              <span className="text-sm text-slate-400">{currentCat?.name}</span>
              <span className="ml-auto font-mono text-indigo-400 font-bold">{formatElapsed(timer.elapsed)}</span>
            </div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="刚才做了什么？"
                className="flex-1 bg-[#0f0f1a] border border-[#3a3a5a] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
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
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowSave(false)}
                className="border border-[#3a3a5a] px-3 py-2 rounded-lg text-sm transition-colors hover:border-indigo-400"
              >
                继续
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-[#2a2a4a] z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-4 px-4 py-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: currentCat?.color || '#6366f1' }}
          />
          <span className="text-2xl">{currentCat?.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-medium">{currentCat?.name}</div>
            <div className="text-xs text-slate-500">
              {timer.startTime && format(new Date(timer.startTime), 'HH:mm', { locale: zhCN })} 开始
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-indigo-400">{formatElapsed(timer.elapsed)}</span>
          <button
            onClick={() => setShowSave(true)}
            className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-full transition-colors"
            title="停止计时"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => {
              cancelTimer()
              setShowSave(false)
            }}
            className="text-slate-500 hover:text-red-400 p-2 transition-colors"
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
