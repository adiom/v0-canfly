export const ADMIN_SESSION_COOKIE = 'canfly-admin-session'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const encoder = new TextEncoder()
const localDevSessionSecret = `local-dev-${crypto.randomUUID()}`

interface AdminSessionPayload {
  email: string
  exp: number
}

export interface AdminSession {
  email: string
}

export function isLocalAdminHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  )
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return localDevSessionSecret
  throw new Error('Missing ADMIN_SESSION_SECRET or ADMIN_PASSWORD')
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function stringToBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToString(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return atob(padded)
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

export async function createAdminToken(email: string) {
  const payload: AdminSessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const encodedPayload = stringToBase64Url(JSON.stringify(payload))
  const signature = await sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifyAdminToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await sign(encodedPayload)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as AdminSessionPayload
    if (!payload.email || payload.exp < Date.now()) return null

    return { email: payload.email }
  } catch {
    return null
  }
}
