import { Client } from 'pg'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const TEST_ADMIN_EMAIL = 'studio-test-admin@canfly.test'
const TEST_ADMIN_LOGIN = 'studio_test_admin'
const TEST_ADMIN_PASSWORD = 'StudioTest_Admin_2026'
const TEST_ADMIN_DISPLAY = 'Studio Test Admin'
const TEST_ADMIN_HANDLE = 'studio_test_admin'
const CREDENTIALS_FILE = join(process.cwd(), 'e2e', '.test-credentials.json')

const PASSWORD_ITERATIONS = 120_000

function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, 'sha256')
  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export default async function globalSetup() {
  loadEnvLocal()

  const url = process.env.DATABASE_URL
  if (!url) {
    console.warn('[e2e setup] DATABASE_URL is not set — skipping admin test setup')
    return
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    const passwordHash = hashPassword(TEST_ADMIN_PASSWORD)

    const userResult = await client.query<{ id: string }>(
      `
        INSERT INTO users (login, email, password_hash, handle, display_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (login) DO UPDATE
          SET password_hash = EXCLUDED.password_hash,
              display_name = EXCLUDED.display_name,
              email = EXCLUDED.email
        RETURNING id
      `,
      [TEST_ADMIN_LOGIN, TEST_ADMIN_EMAIL, passwordHash, TEST_ADMIN_HANDLE, TEST_ADMIN_DISPLAY],
    )
    const userId = userResult.rows[0]?.id
    if (!userId) throw new Error('Failed to upsert test admin user')

    await client.query(
      `
        INSERT INTO user_roles (user_id, role)
        VALUES ($1, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING
      `,
      [userId],
    )

    await client.query(
      `
        INSERT INTO admins (email)
        VALUES ($1)
        ON CONFLICT (email) DO NOTHING
      `,
      [TEST_ADMIN_EMAIL],
    )

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    mkdirSync(dirname(CREDENTIALS_FILE), { recursive: true })
    writeFileSync(
      CREDENTIALS_FILE,
      JSON.stringify(
        {
          userAuth: { login: TEST_ADMIN_LOGIN, password: TEST_ADMIN_PASSWORD, userId },
          adminAuth: { email: TEST_ADMIN_EMAIL, password: adminPassword },
        },
        null,
        2,
      ),
    )

    console.log(`[e2e setup] ✓ Test admin ready: ${TEST_ADMIN_LOGIN} <${TEST_ADMIN_EMAIL}>`)
  } catch (error) {
    console.error('[e2e setup] ✗ Failed to create test admin:', error)
    throw error
  } finally {
    await client.end()
  }
}
