import { useState } from 'react'
import { taskFields } from '../forms.js'
import { dueStatus } from '../format.js'
import { useCrmContext } from '../store.js'
import { Section, TaskList } from './sections.jsx'
import { CreateButton, PageHeader } from './ui.jsx'

const GROUPS = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['later', 'Upcoming'],
  ['done', 'Done'],
]

export function TasksPage() {
  const { data, save } = useCrmContext()
  const [showDone, setShowDone] = useState(false)
  const openCount = data.tasks.filter((t) => !t.done).length

  return (
    <>
      <PageHeader title="Tasks" subtitle={`${openCount} open`}>
        <label className="toggle">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Show done
        </label>
        <CreateButton
          label="New task"
          fields={taskFields(data)}
          onCreate={(v) => save('tasks', { ...v, done: false })}
        />
      </PageHeader>
      <div className="stack">
        {GROUPS.filter(([key]) => showDone || key !== 'done').map(([key, label]) => {
          const tasks = data.tasks.filter((t) => dueStatus(t) === key)
          if (tasks.length === 0 && key !== 'today') return null
          return (
            <Section key={key} title={`${label} (${tasks.length})`}>
              <TaskList tasks={tasks} />
            </Section>
          )
        })}
      </div>
    </>
  )
}
