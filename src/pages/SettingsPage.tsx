import React, { useState } from 'react'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { TIME_TYPE_CONFIG, type TimeType, type Category } from '../types'

const CATEGORY_ICONS = ['💻', '📚', '🏃', '✍️', '🎯', '💡', '🎨', '🎵', '😴', '🍜', '🚗', '🏠', '📱', '💬', '😶', '🧘', '🌿', '📊', '🔬', '🏋️']

const PALETTE = [
  '#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981',
  '#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#ec4899',
  '#f97316', '#14b8a6', '#a855f7', '#0ea5e9', '#d946ef',
]

export function SettingsPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppStore()
  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Omit<Category, 'id'>>({
    name: '', type: 'invest', color: '#6366f1', icon: '💻',
  })

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editId) {
      updateCategory(editId, form)
      setEditId(null)
    } else {
      addCategory(form)
      setShowAdd(false)
    }
    setForm({ name: '', type: 'invest', color: '#6366f1', icon: '💻' })
  }

  const startEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon })
    setShowAdd(false)
  }

  const groupedCats = (['invest', 'maintain', 'consume'] as TimeType[]).map((type) => ({
    type,
    cats: categories.filter((c) => c.type === type),
  }))

  const CategoryForm = () => (
    <div className="bg-[#0f0f1a] rounded-xl p-4 space-y-3 border border-[#2a2a4a]">
      {/* 名称 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">名称</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="分类名称"
          className="w-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {/* 类型 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">类型</label>
        <div className="flex gap-2">
          {(['invest', 'maintain', 'consume'] as TimeType[]).map((t) => {
            const cfg = TIME_TYPE_CONFIG[t]
            return (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  form.type === t
                    ? { backgroundColor: cfg.color, color: 'white' }
                    : { backgroundColor: `${cfg.color}22`, color: cfg.color }
                }
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 图标 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">图标</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setForm((f) => ({ ...f, icon }))}
              className={`text-xl p-1.5 rounded-lg transition-all ${form.icon === icon ? 'bg-indigo-600' : 'hover:bg-[#2a2a4a]'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* 颜色 */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">颜色</label>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => setForm((f) => ({ ...f, color }))}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                outline: form.color === color ? `2px solid ${color}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => { setEditId(null); setShowAdd(false) }}
          className="flex-1 border border-[#2a2a4a] rounded-lg py-2 text-sm hover:border-slate-500 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">设置 · 分类管理</h2>
        <button
          onClick={() => { setShowAdd(true); setEditId(null) }}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          新增分类
        </button>
      </div>

      {showAdd && <CategoryForm />}

      {groupedCats.map(({ type, cats }) => {
        const cfg = TIME_TYPE_CONFIG[type]
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-sm font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              <span className="text-xs text-slate-600">{cfg.desc}</span>
            </div>
            <div className="space-y-1.5">
              {cats.map((cat) => (
                <div key={cat.id}>
                  {editId === cat.id ? (
                    <CategoryForm />
                  ) : (
                    <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-xl px-3 py-2.5 group">
                      <span className="text-xl">{cat.icon}</span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 text-sm">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-[#2a2a4a] text-slate-500 hover:text-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除「${cat.name}」分类？`)) deleteCategory(cat.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
