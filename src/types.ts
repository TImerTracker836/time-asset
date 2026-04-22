// ============================================================
// 核心类型定义
// ============================================================

export type TimeType = 'invest' | 'maintain' | 'consume'

export interface Category {
  id: string
  name: string
  type: TimeType
  color: string
  icon: string
}

export interface TimeEntry {
  id: string
  title: string
  categoryId: string
  startTime: string   // ISO 字符串
  endTime: string     // ISO 字符串
  duration: number    // 分钟
  mood?: 1 | 2 | 3 | 4 | 5
  energy?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  note?: string
  isPlanned: boolean
  createdAt: string
}

export interface TimerState {
  isRunning: boolean
  categoryId: string | null
  startTime: string | null
  elapsed: number     // 秒
}

// ============================================================
// 默认分类
// ============================================================

export const DEFAULT_CATEGORIES: Category[] = [
  // 投资型
  { id: 'deep-work',   name: '深度工作', type: 'invest',   color: '#6366f1', icon: '💻' },
  { id: 'learning',    name: '学习成长', type: 'invest',   color: '#8b5cf6', icon: '📚' },
  { id: 'exercise',    name: '健身锻炼', type: 'invest',   color: '#06b6d4', icon: '🏃' },
  { id: 'creation',    name: '创作输出', type: 'invest',   color: '#3b82f6', icon: '✍️' },
  // 维护型
  { id: 'sleep',       name: '睡眠休息', type: 'maintain', color: '#22c55e', icon: '😴' },
  { id: 'meal',        name: '饮食',     type: 'maintain', color: '#84cc16', icon: '🍜' },
  { id: 'commute',     name: '通勤交通', type: 'maintain', color: '#a3e635', icon: '🚗' },
  { id: 'chore',       name: '家务事务', type: 'maintain', color: '#4ade80', icon: '🏠' },
  // 消耗型
  { id: 'entertainment', name: '娱乐刷屏', type: 'consume', color: '#f59e0b', icon: '📱' },
  { id: 'social',      name: '社交闲聊', type: 'consume',  color: '#fb923c', icon: '💬' },
  { id: 'idle',        name: '发呆等待', type: 'consume',  color: '#ef4444', icon: '😶' },
]

export const TIME_TYPE_CONFIG: Record<TimeType, { label: string; color: string; bg: string; desc: string }> = {
  invest:   { label: '投资型', color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  desc: '增值·成长' },
  maintain: { label: '维护型', color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   desc: '必要·维持' },
  consume:  { label: '消耗型', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', desc: '注意·警惕' },
}
