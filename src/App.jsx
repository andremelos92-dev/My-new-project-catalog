import { useRef } from 'react'
import './App.css'
import { CompanyDetail, CompanyList } from './components/Companies.jsx'
import { ContactDetail, ContactList } from './components/Contacts.jsx'
import { DealBoard, DealDetail } from './components/Deals.jsx'
import { Home } from './components/Home.jsx'
import { TasksPage } from './components/Tasks.jsx'
import { dueStatus } from './format.js'
import { CrmContext, exportData, readImport, useCrm, useRoute } from './store.js'

const SECTIONS = [
  ['home', 'Overview'],
  ['contacts', 'Contacts'],
  ['companies', 'Companies'],
  ['deals', 'Deals'],
  ['tasks', 'Tasks'],
]

function Page({ section, id }) {
  if (section === 'contacts') return id ? <ContactDetail id={id} /> : <ContactList />
  if (section === 'companies') return id ? <CompanyDetail id={id} /> : <CompanyList />
  if (section === 'deals') return id ? <DealDetail id={id} /> : <DealBoard />
  if (section === 'tasks') return <TasksPage />
  return <Home />
}

function App() {
  const crm = useCrm()
  const { section, id } = useRoute()
  const fileInput = useRef(null)
  const dueCount = crm.data.tasks.filter((t) => ['overdue', 'today'].includes(dueStatus(t))).length

  async function onImport(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = await readImport(file)
      if (window.confirm('Replace everything in this CRM with the contents of this file?')) {
        crm.replace(data)
      }
    } catch (err) {
      window.alert(`Could not import: ${err.message}`)
    }
  }

  return (
    <CrmContext.Provider value={crm}>
      <div className="layout">
        <nav className="sidebar">
          <a href="#/" className="brand">CRM</a>
          <ul>
            {SECTIONS.map(([key, label]) => (
              <li key={key}>
                <a href={`#/${key}`} className={section === key ? 'active' : undefined}>
                  {label}
                  {key === 'tasks' && dueCount > 0 && <span className="pill">{dueCount}</span>}
                </a>
              </li>
            ))}
          </ul>
          <div className="sidebar-footer">
            <button className="ghost" onClick={() => exportData(crm.data)}>
              Export
            </button>
            <button className="ghost" onClick={() => fileInput.current.click()}>
              Import
            </button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
          </div>
        </nav>
        <main className="content">
          <Page key={`${section}/${id}`} section={section} id={id} />
        </main>
      </div>
    </CrmContext.Provider>
  )
}

export default App
