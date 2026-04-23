import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Category, TimeEntry, TimerState, PlanBlock, DayPlan, Theme } from '../types'
import { DEFAULT_CATEGORIES } from '../types'
import * as sync from '../lib/sync'

interface AppStore {
  // 数据
  categories: Category[]
  entries: TimeEntry[]
  timer: TimerState
  plans: DayPlan[]
  theme: Theme
  synced: boolean // 是否已从云端同步过

  // 同步
  setSynced: (v: boolean) => void
  loadCloudData: (categories: Category[], entries: TimeEntry[], plans: DayPlan[]) => void

  // 主题操作
  setTheme: (theme: Theme) => void

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
  deletePlan: (date: string) => void
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
      theme: 'dark',
      synced: false,

      // ── 同步 ────────────────────────────────────────
      setSynced: (v) => set({ synced: v }),

      loadCloudData: (categories, entries, plans) => set({ categories, entries, plans, synced: true }),

      // ── 主题 ────────────────────────────────────────
      setTheme: (theme) => set({ theme }),

      // ── 分类 ────────────────────────────────────────
      addCategory: (cat) => {
        const newCat = { ...cat, id: uuidv4() }
        set((s) => ({ categories: [...s.categories, newCat] }))
        sync.pushCategory(newCat)
      },

      updateCategory: (id, cat) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...cat } : c)),
        }))
        const updated = get().categories.find((c) => c.id === id)
        if (updated) sync.pushCategory(updated)
      },

      deleteCategory: (id) => {
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        sync.deleteCategoryCloud(id)
      },

      // ── 时间条目 ────────────────────────────────────
      addEntry: (entry) => {
        const newEntry = { ...entry, id: uuidv4(), createdAt: new Date().toISOString() }
        set((s) => ({ entries: [...s.entries, newEntry] }))
        sync.pushEntry(newEntry)
      },

      updateEntry: (id, entry) => {
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...entry } : e)),
        }))
        const updated = get().entries.find((e) => e.id === id)
        if (updated) sync.pushEntry(updated)
      },

      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
        sync.deleteEntryCloud(id)
      },

      // ── 计时器 ──────────────────────────────────────
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

      // ── 日计划 ──────────────────────────────────────
      getPlanByDate: (date) => get().plans.find((p) => p.date === date),

      addPlanBlock: (date, block) =>
        set((s) => {
          const existing = s.plans.find((p) => p.date === date)
          let updatedPlan: DayPlan
          if (existing) {
            updatedPlan = {
              ...existing,
              blocks: [...existing.blocks, { ...block, id: uuidv4(), isCompleted: false }],
            }
          } else {
            updatedPlan = {
              date,
              blocks: [{ ...block, id: uuidv4(), isCompleted: false }],
            }
          }
          const newPlans = existing
            ? s.plans.map((p) => (p.date === date ? updatedPlan : p))
            : [...s.plans, updatedPlan]
          // 异步推送云端
          setTimeout(() => sync.pushPlan(updatedPlan), 0)
          return { plans: newPlans }
        }),

      updatePlanBlock: (date, blockId, block) =>
        set((s) => ({
          plans: s.plans.map((p) => {
            if (p.date !== date) return p
            const updated = {
              ...p,
              blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...block } : b)),
            }
            setTimeout(() => sync.pushPlan(updated), 0)
            return updated
          }),
        })),

      deletePlanBlock: (date, blockId) =>
        set((s) => ({
          plans: s.plans.map((p) => {
            if (p.date !== date) return p
            const updated = {
              ...p,
              blocks: p.blocks.filter((b) => b.id !== blockId),
            }
            if (updated.blocks.length === 0) {
              setTimeout(() => sync.deletePlanCloud(date), 0)
              return updated
            }
            setTimeout(() => sync.pushPlan(updated), 0)
            return updated
          }),
        })),

      deletePlan: (date) => {
        set((s) => ({ plans: s.plans.filter((p) => p.date !== date) }))
        sync.deletePlanCloud(date)
      },

      togglePlanBlock: (date, blockId) =>
        set((s) => ({
          plans: s.plans.map((p) => {
            if (p.date !== date) return p
            const updated = {
              ...p,
              blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, isCompleted: !b.isCompleted } : b)),
            }
            setTimeout(() => sync.pushPlan(updated), 0)
            return updated
          }),
        })),

      // ── 查询 ────────────────────────────────────────
      getEntriesByDate: (date) => {
        const { entries } = get()
        return entries.filter((e) => e.startTime.startsWith(date))
      },

      getEntriesByRange: (start, end) => {
        const { entries } = get()
        return entries.filter((e) => e.startTime >= start && e.startTime <= end)
      },

      getCategoryById: (id) => get().categories.find((c) => c.id === id),

      // ── 时间黑洞检测 ───────────────────────────────
      getUnrecordedGaps: (date) => {
        const { entries } = get()
        const dayEntries = entries
          .filter((e) => e.startTime.startsWith(date))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))

        const dayStart = new Date(`${date}T06:00:00`)
        const dayEnd = new Date(`${date}T26:00:00`)

        const now = new Date()
        const isToday = date === now.toISOString().substring(0, 10)
        const effectiveEnd = isToday ? Math.min(dayEnd.getTime(), now.getTime()) : dayEnd.getTime()

        const gaps: Array<{ start: string; end: string; minutes: number }> = []
        let cursor = dayStart.getTime()

        for (const entry of dayEntries) {
          const entryStart = new Date(entry.startTime).getTime()
          if (entryStart > cursor) {
            const gapMinutes = Math.round((entryStart - cursor) / 60000)
            if (gapMinutes >= 15) {
              gaps.push({
                start: new Date(cursor).toISOString(),
                end: new Date(entryStart).toISOString(),
                minutes: gapMinutes,
              })
            }
          }
          cursor = Math.max(cursor, new Date(entry.endTime).getTime())
        }

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
      partialize: (s) => ({
        categories: s.categories,
        entries: s.entries,
        plans: s.plans,
        theme: s.theme,
        synced: s.synced,
      }),
    }
  )
)
