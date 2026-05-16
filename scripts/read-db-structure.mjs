import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const schema = process.argv[2] || 'public'

if (!supabaseUrl || !apiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and Supabase API key in .env.local or environment.')
  process.exit(1)
}

const openApiUrl = new URL('/rest/v1/', supabaseUrl)

const response = await fetch(openApiUrl, {
  headers: {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/openapi+json',
    'Accept-Profile': schema,
  },
})

if (!response.ok) {
  const detail = await response.text()
  console.error(`Failed to read Supabase schema (${response.status} ${response.statusText}).`)
  console.error(detail)
  process.exit(1)
}

const document = await response.json()
const definitions = document.definitions || document.components?.schemas || {}
const tables = Object.entries(definitions)
  .filter(([, definition]) => definition?.type === 'object' && definition.properties)
  .sort(([left], [right]) => left.localeCompare(right))

if (tables.length === 0) {
  console.log(`No tables found in schema "${schema}".`)
  process.exit(0)
}

console.log(`Supabase schema: ${schema}`)
console.log(`Tables: ${tables.length}`)

for (const [tableName, definition] of tables) {
  console.log(`\n${tableName}`)

  const required = new Set(definition.required || [])
  const columns = Object.entries(definition.properties).sort(([left], [right]) =>
    left.localeCompare(right),
  )

  for (const [columnName, column] of columns) {
    const type = column.format ? `${column.type}:${column.format}` : column.type || 'unknown'
    const nullable = required.has(columnName) ? 'not null' : 'nullable'
    const description = column.description ? ` - ${column.description}` : ''

    console.log(`  - ${columnName}: ${type} (${nullable})${description}`)
  }
}
