import { useState } from 'react'
import { companyFields, contactFields } from '../forms.js'
import { isOpen, matches, money } from '../format.js'
import { navigate, useCrmContext } from '../store.js'
import { ActivityLog, DealsSection, Facts, Section } from './sections.jsx'
import { CreateButton, Empty, PageHeader, RecordActions } from './ui.jsx'

export function CompanyList() {
  const { data, save } = useCrmContext()
  const [query, setQuery] = useState('')
  const rows = data.companies
    .filter((c) => matches(c, query, ['name', 'industry', 'website', 'phone']))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <PageHeader title="Companies" subtitle={`${data.companies.length} companies`}>
        <input
          type="search"
          className="search"
          placeholder="Search companies"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <CreateButton label="New company" fields={companyFields()} onCreate={(v) => save('companies', v)} />
      </PageHeader>
      {rows.length === 0 ? (
        <Empty>{query ? 'No companies match.' : 'No companies yet. Add your first one.'}</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th className="num">Contacts</th>
                <th className="num">Open deals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const open = data.deals.filter((d) => d.companyId === c.id && isOpen(d))
                return (
                  <tr key={c.id} onClick={() => navigate(`companies/${c.id}`)}>
                    <td>
                      <a href={`#/companies/${c.id}`} className="strong">{c.name}</a>
                      {c.website && <div className="muted">{c.website}</div>}
                    </td>
                    <td>{c.industry}</td>
                    <td className="num">{data.contacts.filter((p) => p.companyId === c.id).length}</td>
                    <td className="num">
                      {open.length > 0 && money(open.reduce((sum, d) => sum + d.value, 0))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function CompanyDetail({ id }) {
  const { data, save, remove } = useCrmContext()
  const company = data.companies.find((c) => c.id === id)
  if (!company) return <Empty>This company no longer exists. <a href="#/companies">Back to companies</a></Empty>
  const people = data.contacts.filter((c) => c.companyId === id)
  const website = company.website && (/^https?:\/\//.test(company.website) ? company.website : `https://${company.website}`)

  return (
    <>
      <a href="#/companies" className="back">← Companies</a>
      <PageHeader title={company.name} subtitle={company.industry}>
        <RecordActions
          title="Company"
          fields={companyFields()}
          record={company}
          onSave={(values) => save('companies', { id, ...values })}
          onDelete={() => {
            remove('companies', id)
            navigate('companies')
          }}
        />
      </PageHeader>
      <Facts
        items={[
          ['Website', website && <a href={website} target="_blank" rel="noopener">{company.website}</a>],
          ['Phone', company.phone && <a href={`tel:${company.phone}`}>{company.phone}</a>],
          ['Address', company.address],
        ]}
      />
      <div className="detail-grid">
        <ActivityLog activities={data.activities.filter((a) => a.companyId === id)} link={{ companyId: id }} />
        <div className="stack">
          <Section
            title="People"
            action={
              <CreateButton
                label="New contact"
                fields={contactFields(data)}
                initial={{ companyId: id }}
                onCreate={(v) => save('contacts', v)}
              />
            }
          >
            {people.length === 0 ? (
              <Empty>No contacts at this company.</Empty>
            ) : (
              <ul className="simple-list">
                {people.map((p) => (
                  <li key={p.id}>
                    <a href={`#/contacts/${p.id}`}>{p.name}</a>
                    <span className="muted">{p.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <DealsSection deals={data.deals.filter((d) => d.companyId === id)} initial={{ companyId: id }} />
        </div>
      </div>
    </>
  )
}
