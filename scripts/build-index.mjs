// Scans public/manuals/<Company>/**/*.pdf, extracts the text of every page,
// and writes public/manuals-index.json so the app can search models instantly.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, relative, sep, basename } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const root = join(import.meta.dirname, '..', 'public')
const manualsDir = join(root, 'manuals')
const outFile = join(root, 'manuals-index.json')

async function findPdfs(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await findPdfs(full)))
    else if (entry.name.toLowerCase().endsWith('.pdf')) files.push(full)
  }
  return files
}

async function extractPages(file) {
  const data = new Uint8Array(await readFile(file))
  const task = getDocument({ data, verbosity: 0 })
  const pdf = await task.promise
  const pages = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => item.str + (item.hasEOL ? '\n' : ' '))
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim()
    pages.push(text)
  }
  await task.destroy()
  return pages
}

// Reuse previous results for PDFs that haven't changed since the last run.
let previous = {}
try {
  const old = JSON.parse(await readFile(outFile, 'utf8'))
  for (const doc of old.documents) previous[doc.file] = doc
} catch {
  previous = {}
}

const files = (await findPdfs(manualsDir)).sort()
const documents = []
for (const file of files) {
  const rel = relative(manualsDir, file).split(sep).join('/')
  const parts = rel.split('/')
  const company = parts.length > 1 ? parts[0] : 'Other'
  const title = basename(file).replace(/\.pdf$/i, '')
  const mtime = (await stat(file)).mtimeMs

  if (previous[rel]?.mtime === mtime) {
    documents.push(previous[rel])
    continue
  }
  try {
    process.stdout.write(`Indexing ${rel}... `)
    const pages = await extractPages(file)
    const empty = pages.filter((p) => !p).length
    console.log(`${pages.length} pages${empty ? ` (${empty} without text — scanned?)` : ''}`)
    documents.push({ company, title, file: rel, mtime, pages })
  } catch (err) {
    console.log(`failed: ${err.message}`)
  }
}

await writeFile(outFile, JSON.stringify({ documents }))
console.log(`Indexed ${documents.length} PDF(s) into public/manuals-index.json`)
