import { useEffect, useMemo, useState } from 'react'
import './App.css'

const BASE = import.meta.env.BASE_URL
const MAX_RESULTS = 50

// Lowercase and drop spaces/dashes/dots so "XR-200 B" matches "xr200b".
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Like normalize(), but also returns where each kept character came from,
// so a match in normalized text can be mapped back to the original text.
function normalizeWithMap(text) {
  let out = ''
  const map = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i].toLowerCase()
    if (/[a-z0-9]/.test(c)) {
      out += c
      map.push(i)
    }
  }
  return { out, map }
}

function pdfUrl(file, page) {
  const path = file.split('/').map(encodeURIComponent).join('/')
  return `${BASE}manuals/${path}#page=${page}`
}

function search(documents, query) {
  const q = normalize(query)
  if (!q) return []
  const results = []
  for (const doc of documents) {
    doc.pages.forEach((text, i) => {
      const { out, map } = doc.normalized[i]
      let at = out.indexOf(q)
      if (at === -1) return
      const first = at
      let hits = 0
      while (at !== -1) {
        hits++
        at = out.indexOf(q, at + q.length)
      }
      const start = map[first]
      const end = map[first + q.length - 1] + 1
      // Exact whole-word matches (e.g. "X200" not inside "X2000") rank first.
      const exact = !/[a-z0-9]/i.test(text[start - 1] ?? '') && !/[a-z0-9]/i.test(text[end] ?? '')
      results.push({ doc, page: i + 1, hits, exact, start, end })
    })
  }
  results.sort((a, b) => b.exact - a.exact || b.hits - a.hits)
  return results
}

function Snippet({ text, start, end }) {
  const from = Math.max(0, start - 60)
  const to = Math.min(text.length, end + 60)
  return (
    <p className="snippet">
      {from > 0 && '…'}
      {text.slice(from, start)}
      <mark>{text.slice(start, end)}</mark>
      {text.slice(end, to)}
      {to < text.length && '…'}
    </p>
  )
}

function App() {
  const [documents, setDocuments] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [company, setCompany] = useState('All')

  useEffect(() => {
    fetch(`${BASE}manuals-index.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Index not found — run "npm run index".')
        return r.json()
      })
      .then((data) =>
        setDocuments(
          data.documents.map((doc) => ({
            ...doc,
            normalized: doc.pages.map(normalizeWithMap),
          })),
        ),
      )
      .catch((err) => setError(err.message))
  }, [])

  const companies = useMemo(() => {
    const groups = new Map()
    for (const doc of documents ?? []) {
      if (!groups.has(doc.company)) groups.set(doc.company, [])
      groups.get(doc.company).push(doc)
    }
    return [...groups].sort(([a], [b]) => a.localeCompare(b))
  }, [documents])

  const visibleDocs = useMemo(
    () => (documents ?? []).filter((d) => company === 'All' || d.company === company),
    [documents, company],
  )

  const results = useMemo(() => search(visibleDocs, query), [visibleDocs, query])

  function openResult(result) {
    window.open(pdfUrl(result.doc.file, result.page), '_blank', 'noopener')
  }

  function onSubmit(e) {
    e.preventDefault()
    if (results.length) openResult(results[0])
  }

  if (error) return <main className="app"><p className="notice">{error}</p></main>
  if (!documents) return <main className="app"><p className="notice">Loading manuals…</p></main>

  return (
    <main className="app">
      <header>
        <h1>Manual Finder</h1>
        <form onSubmit={onSubmit} className="search">
          <input
            autoFocus
            type="search"
            placeholder="Type a model number and press Enter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option>All</option>
            {companies.map(([name]) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </form>
      </header>

      {documents.length === 0 && (
        <p className="notice">
          No PDFs yet. Put them in <code>public/manuals/&lt;Company&gt;/</code> and run{' '}
          <code>npm run index</code>.
        </p>
      )}

      {query.trim() ? (
        <section className="results">
          <p className="count">
            {results.length === 0
              ? 'No matches.'
              : `${results.length} page${results.length === 1 ? '' : 's'} found — Enter opens the first one`}
          </p>
          <ul>
            {results.slice(0, MAX_RESULTS).map((r) => (
              <li key={`${r.doc.file}#${r.page}`}>
                <a href={pdfUrl(r.doc.file, r.page)} target="_blank" rel="noopener">
                  <span className="meta">
                    <strong>{r.doc.company}</strong> · {r.doc.title} · page {r.page}
                  </span>
                  <Snippet text={r.doc.pages[r.page - 1]} start={r.start} end={r.end} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="catalog">
          {companies
            .filter(([name]) => company === 'All' || name === company)
            .map(([name, docs]) => (
              <div key={name} className="company">
                <h2>{name}</h2>
                <ul>
                  {docs.map((doc) => (
                    <li key={doc.file}>
                      <a href={pdfUrl(doc.file, 1)} target="_blank" rel="noopener">
                        {doc.title}
                      </a>
                      <span className="pages">{doc.pages.length} pages</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
    </main>
  )
}

export default App
