import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import pg from 'pg'

const LOCAL_DB_URL = 'postgresql://postgres@localhost:5432/canfly-books'
const SUPABASE_URL = 'https://uvlquijrnrrkkccgtsys.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHF1aWpybnJya2tjY2d0c3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUxMjE3NCwiZXhwIjoyMDkwMDg4MTc0fQ.TTvFb8QEX5vZ54UiDmtKvXPH9UEq7AfRnWDIo6DNJKM'

function curl(url) {
  const out = execSync(
    `curl -s --max-time 30 "${url}" -H "apikey: ${KEY}" -H "Authorization: Bearer ${KEY}"`,
    { maxBuffer: 50 * 1024 * 1024 },
  ).toString()
  const parsed = JSON.parse(out)
  if (!Array.isArray(parsed)) throw new Error(`Unexpected response: ${out.slice(0, 300)}`)
  return parsed
}

// Supabase REST returns JSONB as JS objects — pg needs them serialized to strings
function serialize(v) {
  if (v !== null && typeof v === 'object') return JSON.stringify(v)
  return v
}

const pool = new pg.Pool({ connectionString: LOCAL_DB_URL })

// 1. Insert books without chapters
const books = JSON.parse(readFileSync('/tmp/books_no_chapters.json', 'utf8'))
console.log(`Inserting ${books.length} books (without chapters)...`)
for (const book of books) {
  const cols = Object.keys(book)
  const vals = cols.map(c => serialize(book[c]))
  const phs = cols.map((_,i) => `$${i+1}`)
  const setClauses = cols.filter(c => c !== 'id').map(c => `"${c}"=EXCLUDED."${c}"`)
  try {
    await pool.query(
      `INSERT INTO public.books (${cols.map(c=>`"${c}"`).join(',')}) VALUES (${phs.join(',')})
       ON CONFLICT (id) DO UPDATE SET ${setClauses.join(',')}`,
      vals
    )
    console.log(`  ok: ${book.title}`)
  } catch(e) {
    console.error(`  error "${book.title}": ${e.message}`)
  }
}

// 2. Update chapters per book
console.log('\nFetching chapters per book...')
for (const book of books) {
  process.stdout.write(`  "${book.title}" chapters... `)
  try {
    const rows = curl(`${SUPABASE_URL}/rest/v1/books?select=id,chapters&id=eq.${book.id}`)
    const chapters = rows[0]?.chapters ?? []
    await pool.query(`UPDATE public.books SET chapters=$1 WHERE id=$2`, [
      JSON.stringify(chapters), book.id,
    ])
    console.log(`ok (${Array.isArray(chapters) ? chapters.length : '?'} chapters)`)
  } catch(e) {
    console.error(`FAILED: ${e.message}`)
  }
}

// 3. book_characters
console.log('\nInserting book_characters...')
const bc = curl(`${SUPABASE_URL}/rest/v1/book_characters?select=*`)
let ins = 0
for (const row of bc) {
  try {
    const r = await pool.query(
      `INSERT INTO public.book_characters (book_id, character_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [row.book_id, row.character_id]
    )
    if (r.rowCount > 0) ins++
  } catch(e) { console.error(`  error: ${e.message}`) }
}
console.log(`book_characters: inserted ${ins}`)

await pool.end()
console.log('\nAll done.')
