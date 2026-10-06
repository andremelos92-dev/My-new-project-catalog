import { byNewest, dueStatus, isOpen, money, nameOf, shortDate } from '../format.js'
import { sampleData, useCrmContext } from '../store.js'
import { Section, TaskList } from './sections.jsx'
import { Empty, PageHeader } from './ui.jsx'

export function Home() {
  const { data, replace } = useCrmContext()
  const isEmpty = ['companies', 'contacts', 'deals', 'tasks'].every((k) => data[k].length === 0)
  const open = data.deals.filter(isOpen)
  const won = data.deals.filter((d) => d.stage === 'Won')
  const due = data.tasks.filter((t) => ['overdue', 'today'].includes(dueStatus(t)))
  const overdue = due.filter((t) => dueStatus(t) === 'overdue').length
  const recent = [...data.activities].sort(byNewest).slice(0, 8)

  if (isEmpty) {
    return (
      <>
        <PageHeader title="Welcome" />
        <section className="card welcome">
          <p>
            Your CRM is empty. Start by adding a <a href="#/companies">company</a> or a{' '}
            <a href="#/contacts">contact</a>, or load some sample data to look around.
          </p>
          <p className="muted">Everything is saved in this browser. Use Export to back it up.</p>
          <button className="primary" onClick={() => replace(sampleData())}>
            Load sample data
          </button>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Overview" />
      <div className="stats">
        <Stat label="Open pipeline" value={money(open.reduce((s, d) => s + d.value, 0))} note={`${open.length} deals`} />
        <Stat label="Won" value={money(won.reduce((s, d) => s + d.value, 0))} note={`${won.length} deals`} />
        <Stat label="Due today or overdue" value={due.length} note={overdue ? `${overdue} overdue` : 'none overdue'} alert={overdue > 0} />
        <Stat label="Contacts" value={data.contacts.length} note={`${data.companies.length} companies`} />
      </div>
      <div className="detail-grid">
        <Section title="Due now" action={<a href="#/tasks">All tasks →</a>}>
          <TaskList tasks={due} />
        </Section>
        <Section title="Recent activity">
          {recent.length === 0 ? (
            <Empty>Nothing logged yet.</Empty>
          ) : (
            <ol className="timeline compact">
              {recent.map((a) => {
                const who = nameOf(data.contacts, a.contactId) || nameOf(data.companies, a.companyId)
                const href = a.contactId ? `#/contacts/${a.contactId}` : a.companyId ? `#/companies/${a.companyId}` : `#/deals/${a.dealId}`
                return (
                  <li key={a.id}>
                    <div className="timeline-meta">
                      <span className={`badge activity-${a.type.toLowerCase()}`}>{a.type}</span>
                      <span>{shortDate(a.date)}</span>
                      {who && <a href={href}>{who}</a>}
                    </div>
                    <p className="timeline-text clamp">{a.text}</p>
                  </li>
                )
              })}
            </ol>
          )}
        </Section>
      </div>
    </>
  )
}

function Stat({ label, value, note, alert }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className={alert ? 'stat-note alert' : 'stat-note'}>{note}</span>
    </div>
  )
}
