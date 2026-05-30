import { Pool, QueryResultRow } from 'pg'

let cachedPool: Pool | null = null

function getDatabaseUrl() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL or POSTGRES_URL environment variable')
  }

  return databaseUrl
}

function isLocalDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl)
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

/**
 * Normalize sslmode in connection string to avoid pg v8 deprecation warning.
 * `sslmode=require` is treated as an alias for `verify-full` in pg v8,
 * but will change semantics in pg v9. Replace it explicitly.
 */
function normalizeConnectionString(connectionString: string): string {
  if (!connectionString.includes('sslmode=')) return connectionString

  const url = new URL(connectionString)
  const params = new URLSearchParams(url.search)

  const sslmode = params.get('sslmode')
  if (sslmode === 'require' || sslmode === 'prefer' || sslmode === 'verify-ca') {
    params.set('sslmode', 'verify-full')
    url.search = params.toString()
    return url.toString()
  }

  return connectionString
}

export function getPool() {
  if (!cachedPool) {
    const connectionString = normalizeConnectionString(getDatabaseUrl())
    const isLocal = isLocalDatabaseUrl(connectionString)

    cachedPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    })
  }

  return cachedPool
}

export async function dbQuery<T extends QueryResultRow>(query: string, params: unknown[] = []) {
  const result = await getPool().query<T>(query, params)
  return result.rows
}

export async function dbQueryOne<T extends QueryResultRow>(query: string, params: unknown[] = []) {
  const rows = await dbQuery<T>(query, params)
  return rows[0] ?? null
}
