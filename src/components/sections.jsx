import { useState } from 'react'
import { activityFields, dealFields, taskFields } from '../forms.js'
import { byNewest, dueStatus, money, nameOf, shortDate } from '../format.js'
import { useCrmContext } from '../store.js'
import { CreateButton, Empty, RecordActions, RecordForm } from './ui.jsx'

export function Section({ title, action, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// Timeline of notes, calls, emails and meetings. `link` holds the ids
// (contactId / companyId / dealId) attached to anything logged here.
export function ActivityLog({ activities, link }) {
  const { save, remove } = useCrmContext()
  const [formKey, setFormKey] = useState(0)
  return (
    <Section title="Activity">
      <RecordForm
        key={formKey}
        fields={activityFields()}
        submitLabel="Log activity"
        onSubmit={(values) => {
          save('activities', { ...link, ...values })
          setFormKey((k) => k + 1)
        }}
      />
      {activities.length === 0 ? (
        <Empty>Nothing logged yet.</Empty>
      ) : (
        <ol className="timeline">
          {[...activities].sort(byNewest).map((a) => (
            <li key={a.id}>
              <div className="timeline-meta">
                <span className={`badge activity-${a.type.toLowerCase()}`}>{a.type}</span>
                <span>{shortDate(a.date)}</span>
                <button
                  className="link danger"
                  onClick={() => window.confirm('Delete this entry?') && remove('activities', a.id)}
                >
                  Delete
                </button>
              </div>
              <p className="timeline-text">{a.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

export function TaskList({ tasks, showLinks = true }) {
  const { data, save, remove } = useCrmContext()
  if (tasks.length === 0) return <Empty>No tasks.</Empty>
  const sorted = [...tasks].sort(
    (a, b) => a.done - b.done || (a.due || '9999').localeCompare(b.due || '9999'),
  )
  return (
    <ul className="task-list">
      {sorted.map((t) => {
        const status = dueStatus(t)
        const deal = data.deals.find((d) => d.id === t.dealId)
        return (
          <li key={t.id} className={`task ${status}`}>
            <input
              type="checkbox"
              checked={t.done}
              aria-label={`Mark "${t.title}" done`}
              onChange={() => save('tasks', { id: t.id, done: !t.done })}
            />
            <div className="task-body">
              <span className="task-title">{t.title}</span>
              {showLinks && (t.contactId || deal) && (
                <span className="task-links">
                  {t.contactId && <a href={`#/contacts/${t.contactId}`}>{nameOf(data.contacts, t.contactId)}</a>}
                  {t.contactId && deal && ' · '}
                  {deal && <a href={`#/deals/${deal.id}`}>{deal.title}</a>}
                </span>
              )}
            </div>
            {t.due && <span className="due">{status === 'overdue' ? 'Overdue · ' : ''}{shortDate(t.due)}</span>}
            <RecordActions
              title="Task"
              fields={taskFields(data)}
              record={t}
              onSave={(values) => save('tasks', { id: t.id, ...values })}
              onDelete={() => remove('tasks', t.id)}
            />
          </li>
        )
      })}
    </ul>
  )
}

export function TasksSection({ tasks, initial }) {
  const { data, save } = useCrmContext()
  return (
    <Section
      title="Tasks"
      action={
        <CreateButton
          label="New task"
          fields={taskFields(data)}
          initial={initial}
          onCreate={(values) => save('tasks', { ...values, done: false })}
        />
      }
    >
      <TaskList tasks={tasks} showLinks={false} />
    </Section>
  )
}

export function DealsSection({ deals, initial }) {
  const { data, save } = useCrmContext()
  return (
    <Section
      title="Deals"
      action={
        <CreateButton
          label="New deal"
          fields={dealFields(data)}
          initial={initial}
          onCreate={(values) => save('deals', values)}
        />
      }
    >
      {deals.length === 0 ? (
        <Empty>No deals.</Empty>
      ) : (
        <ul className="simple-list">
          {deals.map((d) => (
            <li key={d.id}>
              <a href={`#/deals/${d.id}`}>{d.title}</a>
              <span className={`badge stage-${d.stage.toLowerCase()}`}>{d.stage}</span>
              <span className="num">{money(d.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export function Facts({ items }) {
  const shown = items.filter(([, value]) => value)
  if (shown.length === 0) return null
  return (
    <dl className="facts">
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
