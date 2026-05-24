import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const ENV_FILES = ['.env.local', '.env']

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const contents = readFileSync(filePath, 'utf8')

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

for (const envFile of ENV_FILES) {
  loadEnvFile(resolve(process.cwd(), envFile))
}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING
const schema = process.argv[2] || 'public'

if (!databaseUrl) {
  console.error('Missing DATABASE_URL or POSTGRES_URL in .env.local or environment.')
  process.exit(1)
}

function isLocalDatabaseUrl(value) {
  try {
    const url = new URL(value)
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabaseUrl(databaseUrl) ? false : { rejectUnauthorized: false },
})

const result = await pool.query(
  `
    SELECT
      table_name,
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = $1
    ORDER BY table_name, ordinal_position
  `,
  [schema],
)
await pool.end()

const rows = result.rows

if (rows.length === 0) {
  console.log(`No tables found in schema "${schema}".`)
  process.exit(0)
}

const tables = new Map()

for (const row of rows) {
  const columns = tables.get(row.table_name) ?? []
  columns.push(row)
  tables.set(row.table_name, columns)
}

console.log(`Postgres schema: ${schema}`)
console.log(`Tables: ${tables.size}`)

for (const [tableName, columns] of tables) {
  console.log(`\n${tableName}`)

  for (const column of columns) {
    const type =
      column.data_type === 'USER-DEFINED' ? column.udt_name : column.data_type
    const nullable = column.is_nullable === 'NO' ? 'not null' : 'nullable'
    const defaultValue = column.column_default ? ` default ${column.column_default}` : ''

    console.log(`  - ${column.column_name}: ${type} (${nullable})${defaultValue}`)
  }
}
