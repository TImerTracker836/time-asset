import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Category, TimeEntry, TimerState } from '../types'
import { DEFAULT_CATEGORIES } from '../types'

interface AppStore {
  // 数据
  categories: Category[]
  entries: TimeEntry[]
  timer: TimerState

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

  // 查询
  getEntriesByDate: (date: string) => TimeEntry[]
  getEntriesByRange: (start: string, end: string) => TimeEntry[]
  getCategoryById: (id: string) => Category | undefined
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
    }),
    {
      name: 'time-asset-storage',
      partialize: (s) => ({ categories: s.categories, entries: s.entries }),
    }
  )
)
