import { useState } from 'react'
import { contactFields } from '../forms.js'
import { matches, nameOf } from '../format.js'
import { navigate, useCrmContext } from '../store.js'
import { ActivityLog, DealsSection, Facts, TasksSection } from './sections.jsx'
import { CreateButton, Empty, PageHeader, RecordActions } from './ui.jsx'

export function ContactList() {
  const { data, save } = useCrmContext()
  const [query, setQuery] = useState('')
  const rows = data.contacts
    .map((c) => ({ ...c, company: nameOf(data.companies, c.companyId) }))
    .filter((c) => matches(c, query, ['name', 'title', 'email', 'phone', 'company']))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <PageHeader title="Contacts" subtitle={`${data.contacts.length} people`}>
        <input
          type="search"
          className="search"
          placeholder="Search contacts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <CreateButton label="New contact" fields={contactFields(data)} onCreate={(v) => save('contacts', v)} />
      </PageHeader>
      {rows.length === 0 ? (
        <Empty>{query ? 'No contacts match.' : 'No contacts yet. Add your first one.'}</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => navigate(`contacts/${c.id}`)}>
                  <td>
                    <a href={`#/contacts/${c.id}`} className="strong">{c.name}</a>
                    {c.title && <div className="muted">{c.title}</div>}
                  </td>
                  <td>{c.company}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function ContactDetail({ id }) {
  const { data, save, remove } = useCrmContext()
  const contact = data.contacts.find((c) => c.id === id)
  if (!contact) return <Empty>This contact no longer exists. <a href="#/contacts">Back to contacts</a></Empty>
  const company = data.companies.find((c) => c.id === contact.companyId)

  return (
    <>
      <a href="#/contacts" className="back">← Contacts</a>
      <PageHeader title={contact.name} subtitle={[contact.title, company?.name].filter(Boolean).join(' at ')}>
        <RecordActions
          title="Contact"
          fields={contactFields(data)}
          record={contact}
          onSave={(values) => save('contacts', { id, ...values })}
          onDelete={() => {
            remove('contacts', id)
            navigate('contacts')
          }}
        />
      </PageHeader>
      <Facts
        items={[
          ['Email', contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>],
          ['Phone', contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>],
          ['Company', company && <a href={`#/companies/${company.id}`}>{company.name}</a>],
        ]}
      />
      <div className="detail-grid">
        <ActivityLog
          activities={data.activities.filter((a) => a.contactId === id)}
          link={{ contactId: id, companyId: contact.companyId || '' }}
        />
        <div className="stack">
          <TasksSection tasks={data.tasks.filter((t) => t.contactId === id)} initial={{ contactId: id }} />
          <DealsSection
            deals={data.deals.filter((d) => d.contactId === id)}
            initial={{ contactId: id, companyId: contact.companyId }}
          />
        </div>
      </div>
    </>
  )
}
