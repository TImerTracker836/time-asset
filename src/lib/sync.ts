import { supabase } from '../lib/supabase'
import type { Category, TimeEntry, DayPlan } from '../types'

// ── 云端数据拉取 ──────────────────────────────────────

export async function fetchCloudData() {
  const [catRes, entryRes, planRes] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('entries').select('*').order('created_at', { ascending: false }),
    supabase.from('plans').select('*'),
  ])

  if (catRes.error) throw new Error(`categories: ${catRes.error.message}`)
  if (entryRes.error) throw new Error(`entries: ${entryRes.error.message}`)
  if (planRes.error) throw new Error(`plans: ${planRes.error.message}`)

  const categories: Category[] = catRes.data.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    color: r.color,
    icon: r.icon,
  }))

  const entries: TimeEntry[] = entryRes.data.map((r: any) => ({
    id: r.id,
    title: r.title,
    categoryId: r.category_id,
    startTime: r.start_time,
    endTime: r.end_time,
    duration: r.duration,
    note: r.note || undefined,
    isPlanned: r.is_planned,
    createdAt: r.created_at,
  }))

  const plans: DayPlan[] = planRes.data.map((r: any) => ({
    date: r.date,
    blocks: (r.blocks || []) as DayPlan['blocks'],
  }))

  return { categories, entries, plans }
}

// ── 云端数据推送 ──────────────────────────────────────

export async function pushCategory(cat: Category) {
  const { error } = await supabase.from('categories').upsert({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    color: cat.color,
    icon: cat.icon,
  }, { onConflict: 'id' })
  if (error) console.error('pushCategory error:', error)
}

export async function deleteCategoryCloud(id: string) {
  await supabase.from('categories').delete().eq('id', id)
}

export async function pushEntry(entry: TimeEntry) {
  const { error } = await supabase.from('entries').upsert({
    id: entry.id,
    title: entry.title,
    category_id: entry.categoryId,
    start_time: entry.startTime,
    end_time: entry.endTime,
    duration: entry.duration,
    note: entry.note || null,
    is_planned: entry.isPlanned,
    created_at: entry.createdAt,
  }, { onConflict: 'id' })
  if (error) console.error('pushEntry error:', error)
}

export async function deleteEntryCloud(id: string) {
  await supabase.from('entries').delete().eq('id', id)
}

export async function pushPlan(plan: DayPlan) {
  const { data: existing } = await supabase.from('plans').select('id').eq('date', plan.date).single()
  if (existing) {
    await supabase.from('plans').update({ blocks: plan.blocks }).eq('id', existing.id)
  } else {
    await supabase.from('plans').insert({ date: plan.date, blocks: plan.blocks })
  }
}

export async function deletePlanCloud(date: string) {
  await supabase.from('plans').delete().eq('date', date)
}
