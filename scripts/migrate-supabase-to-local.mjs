/**
 * Migrates all data from Supabase REST API to local Postgres.
 * Usage: node scripts/migrate-supabase-to-local.mjs
 */

import { execSync } from 'node:child_process'
import pg from 'pg'

const SUPABASE_URL = 'https://uvlquijrnrrkkccgtsys.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bHF1aWpybnJya2tjY2d0c3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUxMjE3NCwiZXhwIjoyMDkwMDg4MTc0fQ.TTvFb8QEX5vZ54UiDmtKvXPH9UEq7AfRnWDIo6DNJKM'
const LOCAL_DB_URL = 'postgresql://postgres@localhost:5432/canfly-books'

const TABLES = [
  'books',
  'characters',
  'character_relationships',
  'book_characters',
  'orders',
  'admins',
  'character_posts',
  'homepage_slides',
]

function fetchAllCurl(table) {
  const rows = []
  let offset = 0
  const limit = 1000
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`
    const out = execSync(
      `curl -s --max-time 30 "${url}" ` +
        `-H "apikey: ${SUPABASE_KEY}" ` +
        `-H "Authorization: Bearer ${SUPABASE_KEY}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    ).toString()
    const page = JSON.parse(out)
    if (!Array.isArray(page)) {
      throw new Error(`Unexpected response for ${table}: ${out.slice(0, 300)}`)
    }
    rows.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return rows
}

async function main() {
  const local = new pg.Pool({ connectionString: LOCAL_DB_URL })
  await local.query('SELECT 1')
  console.log('Connected to local Postgres.\n')

  for (const table of TABLES) {
    process.stdout.write(`Fetching ${table}... `)
    let rows
    try {
      rows = fetchAllCurl(table)
    } catch (e) {
      console.error(`ERROR: ${e.message}`)
      continue
    }
    console.log(`${rows.length} rows`)
    if (rows.length === 0) continue

    let inserted = 0
    let skipped = 0
    for (const row of rows) {
      const cols = Object.keys(row)
      const vals = cols.map((c) => {
        const v = row[c]
        // pg driver handles objects as JSON automatically
        return v
      })
      const placeholders = cols.map((_, i) => `$${i + 1}`)
      const sql = `INSERT INTO public."${table}" (${cols.map((c) => `"${c}"`).join(', ')})
                   VALUES (${placeholders.join(', ')})
                   ON CONFLICT DO NOTHING`
      try {
        const r = await local.query(sql, vals)
        if (r.rowCount > 0) inserted++
        else skipped++
      } catch (e) {
        console.error(`\n  Row error in ${table}: ${e.message}`)
        console.error('  Row:', JSON.stringify(row).slice(0, 300))
      }
    }
    console.log(`  -> inserted: ${inserted}, skipped: ${skipped}`)
  }

  await local.end()
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
