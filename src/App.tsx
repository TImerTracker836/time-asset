import React, { useState, useEffect } from 'react'
import { Clock, BarChart2, List, Settings, Sun, Moon, Monitor } from 'lucide-react'
import { TodayPage } from './pages/TodayPage'
import { InsightsPage } from './pages/InsightsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimerBar } from './components/TimerBar'
import { useAppStore } from './store/useAppStore'
import type { Theme } from './types'

type Tab = 'today' | 'insights' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'today',    label: '今日',   icon: Clock },
  { id: 'insights', label: '分析',   icon: BarChart2 },
  { id: 'history',  label: '历史',   icon: List },
  { id: 'settings', label: '设置',   icon: Settings },
]

const THEME_OPTIONS: { value: Theme; label: string; icon: React.FC<{ size?: number }> }[] = [
  { value: 'dark',   label: '暗色', icon: Moon },
  { value: 'light',  label: '亮色', icon: Sun },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

function getEffectiveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const { timer, theme, setTheme } = useAppStore()
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  // 应用主题 class 到 <html>
  useEffect(() => {
    const effective = getEffectiveTheme(theme)
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(effective)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        root.classList.remove('dark', 'light')
        root.classList.add(mq.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border-primary shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-sm text-white">⏱</div>
          <span className="font-bold text-lg tracking-tight">时间账本</span>
        </div>
        <div className="flex items-center gap-3">
          {/* 主题切换 */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
              title="切换主题"
            >
              <ThemeIcon size={18} />
            </button>
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-bg-card border border-border-secondary rounded-xl shadow-[var(--shadow-modal)] z-50 py-1 min-w-[120px]">
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => { setTheme(value); setShowThemeMenu(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                        theme === value
                          ? 'text-accent bg-accent-bg'
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="text-xs text-text-muted font-mono">
            {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={`flex-1 overflow-hidden ${timer.isRunning ? 'pb-16' : ''}`}>
        {activeTab === 'today'    && <TodayPage />}
        {activeTab === 'insights' && <InsightsPage />}
        {activeTab === 'history'  && <HistoryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* 底部导航 */}
      <nav className={`shrink-0 border-t border-border-primary bg-bg-primary ${timer.isRunning ? 'hidden' : ''}`}>
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                activeTab === id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 计时器悬浮条 */}
      <TimerBar onSave={() => setActiveTab('today')} />
    </div>
  )
}
