import { createContext, useContext, useEffect, useReducer, useState } from 'react'

const STORAGE_KEY = 'crm-data-v1'

export const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
export const ACTIVITY_TYPES = ['Note', 'Call', 'Email', 'Meeting']

const EMPTY = { companies: [], contacts: [], deals: [], activities: [], tasks: [] }

export function newId() {
  return crypto.randomUUID()
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return saved ? { ...EMPTY, ...saved } : EMPTY
  } catch {
    return EMPTY
  }
}

// Removing a record also cleans up anything that points at it, so the UI never
// shows links to things that no longer exist.
function removeRecord(state, collection, id) {
  const next = { ...state, [collection]: state[collection].filter((r) => r.id !== id) }
  const unlink = (key) => (r) => (r[key] === id ? { ...r, [key]: '' } : r)
  if (collection === 'companies') {
    next.contacts = next.contacts.map(unlink('companyId'))
    next.deals = next.deals.map(unlink('companyId'))
    next.activities = next.activities.map(unlink('companyId'))
  }
  if (collection === 'contacts') {
    next.deals = next.deals.map(unlink('contactId'))
    next.tasks = next.tasks.map(unlink('contactId'))
    // Keep entries that also belong to a company or deal; drop ones only about this person.
    next.activities = next.activities
      .filter((a) => a.contactId !== id || a.companyId || a.dealId)
      .map(unlink('contactId'))
  }
  if (collection === 'deals') {
    next.tasks = next.tasks.map(unlink('dealId'))
    next.activities = next.activities.map(unlink('dealId'))
  }
  return next
}

function reducer(state, action) {
  switch (action.type) {
    case 'save': {
      const { collection, record } = action
      const list = state[collection]
      const exists = list.some((r) => r.id === record.id)
      return {
        ...state,
        [collection]: exists
          ? list.map((r) => (r.id === record.id ? { ...r, ...record } : r))
          : [...list, { createdAt: new Date().toISOString(), ...record }],
      }
    }
    case 'remove':
      return removeRecord(state, action.collection, action.id)
    case 'replace':
      return { ...EMPTY, ...action.data }
    default:
      return state
  }
}

export function useCrm() {
  const [data, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return {
    data,
    save: (collection, record) =>
      dispatch({ type: 'save', collection, record: { id: newId(), ...record } }),
    remove: (collection, id) => dispatch({ type: 'remove', collection, id }),
    replace: (newData) => dispatch({ type: 'replace', data: newData }),
  }
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `crm-backup-${today()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function readImport(file) {
  const data = JSON.parse(await file.text())
  if (!Object.keys(EMPTY).every((key) => Array.isArray(data[key] ?? []))) {
    throw new Error('This file is not a CRM backup.')
  }
  return data
}

export function sampleData() {
  const acme = newId()
  const globex = newId()
  const ana = newId()
  const ben = newId()
  const deal = newId()
  const now = new Date().toISOString()
  const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
  return {
    companies: [
      { id: acme, name: 'Acme Corp', industry: 'Manufacturing', website: 'acme.example', phone: '555-0100', createdAt: now },
      { id: globex, name: 'Globex', industry: 'Energy', website: 'globex.example', phone: '555-0199', createdAt: now },
    ],
    contacts: [
      { id: ana, name: 'Ana Silva', title: 'Purchasing Manager', email: 'ana@acme.example', phone: '555-0101', companyId: acme, createdAt: now },
      { id: ben, name: 'Ben Carter', title: 'Plant Engineer', email: 'ben@globex.example', phone: '555-0198', companyId: globex, createdAt: now },
    ],
    deals: [
      { id: deal, title: 'Acme chiller replacement', value: 48000, stage: 'Proposal', contactId: ana, companyId: acme, closeDate: inDays(30), createdAt: now },
      { id: newId(), title: 'Globex service contract', value: 12000, stage: 'Lead', contactId: ben, companyId: globex, closeDate: inDays(60), createdAt: now },
    ],
    activities: [
      { id: newId(), type: 'Call', text: 'Discussed replacing the two old chillers. Wants a quote by month end.', date: inDays(-2), contactId: ana, companyId: acme, dealId: deal, createdAt: now },
    ],
    tasks: [
      { id: newId(), title: 'Send quote to Ana', due: inDays(3), done: false, contactId: ana, dealId: deal, createdAt: now },
      { id: newId(), title: 'Intro call with Ben', due: inDays(-1), done: false, contactId: ben, dealId: '', createdAt: now },
    ],
  }
}

export const CrmContext = createContext(null)

export function useCrmContext() {
  return useContext(CrmContext)
}

// Routes look like "#/contacts" or "#/contacts/<id>".
export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return { section: route[0] || 'home', id: route[1] }
}

export function navigate(path) {
  window.location.hash = `/${path}`
}
