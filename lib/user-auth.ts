export const USER_SESSION_COOKIE = 'canfly-user-session'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30
const READER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365
const PASSWORD_ITERATIONS = 120_000
const encoder = new TextEncoder()
const localDevSessionSecret = `local-dev-${crypto.randomUUID()}`

interface UserSessionPayload {
  userId: string
  exp: number
  kind?: 'user' | 'reader'
}

export interface UserSession {
  userId: string
}

function getSessionSecret() {
  const secret = process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return localDevSessionSecret
  throw new Error('Missing USER_SESSION_SECRET or ADMIN_SESSION_SECRET')
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function stringToBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToString(value: string) {
  const bytes = base64UrlToBytes(value)
  return new TextDecoder().decode(bytes)
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return toBase64Url(new Uint8Array(signature))
}

export async function createUserToken(userId: string) {
  const payload: UserSessionPayload = {
    userId,
    exp: Date.now() + SESSION_TTL_MS,
    kind: 'user',
  }
  const encodedPayload = stringToBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function createReaderToken(userId: string) {
  const payload: UserSessionPayload = {
    userId,
    exp: Date.now() + READER_SESSION_TTL_MS,
    kind: 'reader',
  }
  const encodedPayload = stringToBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifyUserToken(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await sign(encodedPayload)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as UserSessionPayload
    if (!payload.userId || payload.exp < Date.now()) return null
    if (payload.kind && payload.kind !== 'user') return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}

export async function verifyReaderToken(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await sign(encodedPayload)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as UserSessionPayload
    if (!payload.userId || payload.exp < Date.now() || payload.kind !== 'reader') return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  )

  return `pbkdf2$${PASSWORD_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return false

  const [scheme, iterationsRaw, saltRaw, hashRaw] = passwordHash.split('$')
  const iterations = Number(iterationsRaw)

  if (scheme !== 'pbkdf2' || !Number.isFinite(iterations) || !saltRaw || !hashRaw) {
    return false
  }

  const salt = base64UrlToBytes(saltRaw)
  const expectedHash = hashRaw
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    key,
    256,
  )

  return toBase64Url(new Uint8Array(bits)) === expectedHash
}
