import { useState } from 'react'
import { dealFields } from '../forms.js'
import { isOpen, money, nameOf, shortDate } from '../format.js'
import { STAGES, navigate, useCrmContext } from '../store.js'
import { ActivityLog, Facts, TasksSection } from './sections.jsx'
import { CreateButton, Empty, PageHeader, RecordActions } from './ui.jsx'

// Kanban board: drag a card to another column to change its stage.
export function DealBoard() {
  const { data, save } = useCrmContext()
  const [dragOver, setDragOver] = useState(null)
  const openValue = data.deals.filter(isOpen).reduce((sum, d) => sum + d.value, 0)

  return (
    <>
      <PageHeader title="Deals" subtitle={`${money(openValue)} in open deals`}>
        <CreateButton label="New deal" fields={dealFields(data)} onCreate={(v) => save('deals', v)} />
      </PageHeader>
      <div className="board">
        {STAGES.map((stage) => {
          const deals = data.deals.filter((d) => d.stage === stage)
          return (
            <section
              key={stage}
              className={`column${dragOver === stage ? ' drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(stage)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                setDragOver(null)
                save('deals', { id: e.dataTransfer.getData('text/plain'), stage })
              }}
            >
              <header>
                <h2>
                  <span className={`dot stage-${stage.toLowerCase()}`} />
                  {stage} <span className="muted">{deals.length}</span>
                </h2>
                <span className="muted">{money(deals.reduce((sum, d) => sum + d.value, 0))}</span>
              </header>
              {deals.map((d) => (
                <a
                  key={d.id}
                  href={`#/deals/${d.id}`}
                  className="deal-card"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', d.id)}
                >
                  <strong>{d.title}</strong>
                  <span className="num">{money(d.value)}</span>
                  <span className="muted">
                    {[nameOf(data.companies, d.companyId) || nameOf(data.contacts, d.contactId), d.closeDate && shortDate(d.closeDate)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </a>
              ))}
            </section>
          )
        })}
      </div>
    </>
  )
}

export function DealDetail({ id }) {
  const { data, save, remove } = useCrmContext()
  const deal = data.deals.find((d) => d.id === id)
  if (!deal) return <Empty>This deal no longer exists. <a href="#/deals">Back to deals</a></Empty>

  return (
    <>
      <a href="#/deals" className="back">← Deals</a>
      <PageHeader title={deal.title} subtitle={money(deal.value)}>
        <select
          className="stage-select"
          value={deal.stage}
          aria-label="Stage"
          onChange={(e) => save('deals', { id, stage: e.target.value })}
        >
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <RecordActions
          title="Deal"
          fields={dealFields(data)}
          record={deal}
          onSave={(values) => save('deals', { id, ...values })}
          onDelete={() => {
            remove('deals', id)
            navigate('deals')
          }}
        />
      </PageHeader>
      <Facts
        items={[
          ['Contact', deal.contactId && <a href={`#/contacts/${deal.contactId}`}>{nameOf(data.contacts, deal.contactId)}</a>],
          ['Company', deal.companyId && <a href={`#/companies/${deal.companyId}`}>{nameOf(data.companies, deal.companyId)}</a>],
          ['Expected close', shortDate(deal.closeDate)],
        ]}
      />
      <div className="detail-grid">
        <ActivityLog
          activities={data.activities.filter((a) => a.dealId === id)}
          link={{ dealId: id, contactId: deal.contactId || '', companyId: deal.companyId || '' }}
        />
        <TasksSection
          tasks={data.tasks.filter((t) => t.dealId === id)}
          initial={{ dealId: id, contactId: deal.contactId }}
        />
      </div>
    </>
  )
}
