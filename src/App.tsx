import React, { useState } from 'react'
import { Clock, BarChart2, List, Settings } from 'lucide-react'
import { TodayPage } from './pages/TodayPage'
import { InsightsPage } from './pages/InsightsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimerBar } from './components/TimerBar'
import { useAppStore } from './store/useAppStore'

type Tab = 'today' | 'insights' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'today',    label: '今日',   icon: Clock },
  { id: 'insights', label: '分析',   icon: BarChart2 },
  { id: 'history',  label: '历史',   icon: List },
  { id: 'settings', label: '设置',   icon: Settings },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const { timer } = useAppStore()

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e2e] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm">⏱</div>
          <span className="font-bold text-lg tracking-tight">时间账本</span>
        </div>
        <div className="text-xs text-slate-600 font-mono">
          {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
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
      <nav className={`shrink-0 border-t border-[#1e1e2e] bg-[#0f0f14] ${timer.isRunning ? 'hidden' : ''}`}>
        <div className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                activeTab === id ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'
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
