import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Category, TimeEntry, TimerState, PlanBlock, DayPlan } from '../types'
import { DEFAULT_CATEGORIES } from '../types'

interface AppStore {
  // 数据
  categories: Category[]
  entries: TimeEntry[]
  timer: TimerState
  plans: DayPlan[]

  // 分类操作
  addCategory: (cat: Omit<Category, 'id'>) => void
  updateCategory: (id: string, cat: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // 时间条目操作
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void

  // 计时器操作
  startTimer: (categoryId: string) => void
  stopTimer: (title: string, note?: string) => TimeEntry | null
  cancelTimer: () => void
  tickTimer: () => void

  // 日计划操作
  getPlanByDate: (date: string) => DayPlan | undefined
  addPlanBlock: (date: string, block: Omit<PlanBlock, 'id' | 'isCompleted'>) => void
  updatePlanBlock: (date: string, blockId: string, block: Partial<PlanBlock>) => void
  deletePlanBlock: (date: string, blockId: string) => void
  togglePlanBlock: (date: string, blockId: string) => void

  // 查询
  getEntriesByDate: (date: string) => TimeEntry[]
  getEntriesByRange: (start: string, end: string) => TimeEntry[]
  getCategoryById: (id: string) => Category | undefined

  // 时间黑洞检测
  getUnrecordedGaps: (date: string) => Array<{ start: string; end: string; minutes: number }>
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      entries: [],
      timer: {
        isRunning: false,
        categoryId: null,
        startTime: null,
        elapsed: 0,
      },
      plans: [],

      // ── 分类 ──────────────────────────────────────────
      addCategory: (cat) =>
        set((s) => ({ categories: [...s.categories, { ...cat, id: uuidv4() }] })),

      updateCategory: (id, cat) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...cat } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      // ── 时间条目 ──────────────────────────────────────
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            ...s.entries,
            { ...entry, id: uuidv4(), createdAt: new Date().toISOString() },
          ],
        })),

      updateEntry: (id, entry) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...entry } : e)),
        })),

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      // ── 计时器 ────────────────────────────────────────
      startTimer: (categoryId) =>
        set({
          timer: {
            isRunning: true,
            categoryId,
            startTime: new Date().toISOString(),
            elapsed: 0,
          },
        }),

      stopTimer: (title, note) => {
        const { timer, addEntry } = get()
        if (!timer.isRunning || !timer.startTime || !timer.categoryId) return null
        const endTime = new Date().toISOString()
        const duration = Math.round(
          (new Date(endTime).getTime() - new Date(timer.startTime).getTime()) / 60000
        )
        const entry: Omit<TimeEntry, 'id' | 'createdAt'> = {
          title,
          categoryId: timer.categoryId,
          startTime: timer.startTime,
          endTime,
          duration,
          note,
          isPlanned: false,
        }
        addEntry(entry)
        set({ timer: { isRunning: false, categoryId: null, startTime: null, elapsed: 0 } })
        return { ...entry, id: '', createdAt: '' }
      },

      cancelTimer: () =>
        set({ timer: { isRunning: false, categoryId: null, startTime: null, elapsed: 0 } }),

      tickTimer: () =>
        set((s) => ({
          timer: { ...s.timer, elapsed: s.timer.elapsed + 1 },
        })),

      // ── 日计划 ────────────────────────────────────────
      getPlanByDate: (date) => get().plans.find((p) => p.date === date),

      addPlanBlock: (date, block) =>
        set((s) => {
          const existing = s.plans.find((p) => p.date === date)
          if (existing) {
            return {
              plans: s.plans.map((p) =>
                p.date === date
                  ? { ...p, blocks: [...p.blocks, { ...block, id: uuidv4(), isCompleted: false }] }
                  : p
              ),
            }
          }
          return {
            plans: [...s.plans, { date, blocks: [{ ...block, id: uuidv4(), isCompleted: false }] }],
          }
        }),

      updatePlanBlock: (date, blockId, block) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.date === date
              ? { ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...block } : b)) }
              : p
          ),
        })),

      deletePlanBlock: (date, blockId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.date === date
              ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
              : p
          ),
        })),

      togglePlanBlock: (date, blockId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.date === date
              ? { ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, isCompleted: !b.isCompleted } : b)) }
              : p
          ),
        })),

      // ── 查询 ──────────────────────────────────────────
      getEntriesByDate: (date) => {
        const { entries } = get()
        return entries.filter((e) => e.startTime.startsWith(date))
      },

      getEntriesByRange: (start, end) => {
        const { entries } = get()
        return entries.filter((e) => e.startTime >= start && e.startTime <= end)
      },

      getCategoryById: (id) => get().categories.find((c) => c.id === id),

      // ── 时间黑洞检测 ─────────────────────────────────
      getUnrecordedGaps: (date) => {
        const { entries } = get()
        const dayEntries = entries
          .filter((e) => e.startTime.startsWith(date))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        // 定义当天的范围：6:00 到次日 2:00（覆盖晚睡）
        const dayStart = new Date(`${date}T06:00:00`)
        const dayEnd = new Date(`${date}T26:00:00`) // 等于次日2:00

        // 如果是今天，上限是当前时间
        const now = new Date()
        const isToday = date === now.toISOString().substring(0, 10)
        const effectiveEnd = isToday ? Math.min(dayEnd.getTime(), now.getTime()) : dayEnd.getTime()

        const gaps: Array<{ start: string; end: string; minutes: number }> = []
        let cursor = dayStart.getTime()

        for (const entry of dayEntries) {
          const entryStart = new Date(entry.startTime).getTime()
          if (entryStart > cursor) {
            const gapMinutes = Math.round((entryStart - cursor) / 60000)
            if (gapMinutes >= 15) { // 只显示 15 分钟以上的空白
              gaps.push({
                start: new Date(cursor).toISOString(),
                end: new Date(entryStart).toISOString(),
                minutes: gapMinutes,
              })
            }
          }
          cursor = Math.max(cursor, new Date(entry.endTime).getTime())
        }

        // 检查到最后一个条目/当前时间的空白
        if (effectiveEnd - cursor >= 15 * 60 * 1000) {
          gaps.push({
            start: new Date(cursor).toISOString(),
            end: new Date(effectiveEnd).toISOString(),
            minutes: Math.round((effectiveEnd - cursor) / 60000),
          })
        }

        return gaps
      },
    }),
    {
      name: 'time-asset-storage',
      partialize: (s) => ({ categories: s.categories, entries: s.entries, plans: s.plans }),
    }
  )
)
