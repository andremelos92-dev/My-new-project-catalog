import { today } from './store.js'

const moneyFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function money(value) {
  return moneyFormat.format(Number(value) || 0)
}

export function shortDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: y === new Date().getFullYear() ? undefined : 'numeric',
  })
}

export function nameOf(list, id) {
  return list.find((r) => r.id === id)?.name ?? ''
}

export function matches(record, query, keys) {
  const q = query.trim().toLowerCase()
  return !q || keys.some((k) => String(record[k] ?? '').toLowerCase().includes(q))
}

export function isOpen(deal) {
  return deal.stage !== 'Won' && deal.stage !== 'Lost'
}

export function dueStatus(task) {
  if (task.done) return 'done'
  if (!task.due) return 'later'
  const t = today()
  return task.due < t ? 'overdue' : task.due === t ? 'today' : 'later'
}

export function byNewest(a, b) {
  return (b.date || b.createdAt).localeCompare(a.date || a.createdAt)
}
