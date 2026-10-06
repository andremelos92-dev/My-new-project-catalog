import { useEffect, useRef, useState } from 'react'

export function Modal({ title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current.showModal()
  }, [])
  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <h2>{title}</h2>
      {children}
    </dialog>
  )
}

// Renders a form from a list of field definitions:
// { name, label, type: text|email|tel|url|number|date|textarea|select, options, required }
export function RecordForm({ fields, initial = {}, submitLabel = 'Save', onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.default ?? ''])),
  )
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  function submit(e) {
    e.preventDefault()
    const record = { ...values }
    for (const f of fields) {
      if (f.type === 'number') record[f.name] = Number(record[f.name]) || 0
      if (typeof record[f.name] === 'string') record[f.name] = record[f.name].trim()
    }
    onSubmit(record)
  }

  return (
    <form className="record-form" onSubmit={submit}>
      {fields.map((f) => (
        <label key={f.name} className={f.type === 'textarea' ? 'wide' : undefined}>
          <span>{f.label}</span>
          <Input field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
        </label>
      ))}
      <div className="form-actions wide">
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Input({ field, value, onChange }) {
  const common = {
    value,
    required: field.required,
    autoFocus: field.autoFocus,
    onChange: (e) => onChange(e.target.value),
  }
  if (field.type === 'textarea') return <textarea rows={3} {...common} />
  if (field.type === 'select') {
    return (
      <select {...common}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return <input type={field.type || 'text'} min={field.type === 'number' ? 0 : undefined} {...common} />
}

// Edit/delete buttons plus the modal that edits the record.
export function RecordActions({ title, fields, record, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="record-actions">
      <button className="ghost" onClick={() => setEditing(true)}>
        Edit
      </button>
      <button
        className="ghost danger"
        onClick={() => window.confirm(`Delete this ${title.toLowerCase()}?`) && onDelete()}
      >
        Delete
      </button>
      {editing && (
        <Modal title={`Edit ${title.toLowerCase()}`} onClose={() => setEditing(false)}>
          <RecordForm
            fields={fields}
            initial={record}
            onCancel={() => setEditing(false)}
            onSubmit={(values) => {
              onSave(values)
              setEditing(false)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

// A "New …" button that opens a form in a modal.
export function CreateButton({ label, fields, initial, onCreate }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="primary" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)}>
          <RecordForm
            fields={fields}
            initial={initial}
            submitLabel="Create"
            onCancel={() => setOpen(false)}
            onSubmit={(values) => {
              onCreate(values)
              setOpen(false)
            }}
          />
        </Modal>
      )}
    </>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </header>
  )
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}
