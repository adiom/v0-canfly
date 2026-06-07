import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export interface TestCredentials {
  userAuth: { login: string; password: string; userId: string }
  adminAuth: { email: string; password: string }
}

const CREDENTIALS_FILE = join(process.cwd(), 'e2e', '.test-credentials.json')

export function loadTestCredentials(): TestCredentials | null {
  if (!existsSync(CREDENTIALS_FILE)) return null
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8')) as TestCredentials
  } catch {
    return null
  }
}
