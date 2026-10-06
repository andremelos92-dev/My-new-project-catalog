import { ACTIVITY_TYPES, STAGES, today } from './store.js'

const pick = (list, empty) => [
  { value: '', label: empty },
  ...[...list].sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({ value: r.id, label: r.name })),
]

export function companyFields() {
  return [
    { name: 'name', label: 'Name', required: true, autoFocus: true },
    { name: 'industry', label: 'Industry' },
    { name: 'website', label: 'Website' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'address', label: 'Address', type: 'textarea' },
  ]
}

export function contactFields(data) {
  return [
    { name: 'name', label: 'Name', required: true, autoFocus: true },
    { name: 'title', label: 'Job title' },
    { name: 'companyId', label: 'Company', type: 'select', options: pick(data.companies, 'No company') },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
  ]
}

export function dealFields(data) {
  return [
    { name: 'title', label: 'Deal', required: true, autoFocus: true },
    { name: 'value', label: 'Value ($)', type: 'number', default: 0 },
    { name: 'stage', label: 'Stage', type: 'select', default: STAGES[0], options: STAGES.map((s) => ({ value: s, label: s })) },
    { name: 'closeDate', label: 'Expected close', type: 'date' },
    { name: 'contactId', label: 'Contact', type: 'select', options: pick(data.contacts, 'No contact') },
    { name: 'companyId', label: 'Company', type: 'select', options: pick(data.companies, 'No company') },
  ]
}

export function taskFields(data) {
  const deals = data.deals.map((d) => ({ id: d.id, name: d.title }))
  return [
    { name: 'title', label: 'Task', required: true, autoFocus: true },
    { name: 'due', label: 'Due', type: 'date', default: today() },
    { name: 'contactId', label: 'Contact', type: 'select', options: pick(data.contacts, 'No contact') },
    { name: 'dealId', label: 'Deal', type: 'select', options: pick(deals, 'No deal') },
  ]
}

export function activityFields() {
  return [
    { name: 'type', label: 'Type', type: 'select', default: ACTIVITY_TYPES[0], options: ACTIVITY_TYPES.map((t) => ({ value: t, label: t })) },
    { name: 'date', label: 'Date', type: 'date', default: today(), required: true },
    { name: 'text', label: 'What happened?', type: 'textarea', required: true },
  ]
}
