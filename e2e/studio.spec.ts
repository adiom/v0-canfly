import { test, expect, type Page } from '@playwright/test'
import { loadTestCredentials, type TestCredentials } from './setup/credentials'

const STUDIO_ROUTES = ['/studio', '/studio/characters'] as const

const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /tiptap warn/i,
  /immediatelyRender/i,
  /Next\.js detected\./i,
]

function attachErrorCollectors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))) return
    errors.push(`[console.error] ${text}`)
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.includes('/_next/') || url.startsWith('chrome-extension://')) return
    errors.push(`[requestfailed] ${req.method()} ${url} → ${req.failure()?.errorText}`)
  })
  return errors
}

const CREDENTIALS = loadTestCredentials()

test.describe('smoke: studio routes (admin role)', () => {
  test.skip(
    !CREDENTIALS,
    'Test admin не создан — DATABASE_URL не настроен или globalSetup упал',
  )

  let credentials: TestCredentials

  test.beforeAll(() => {
    credentials = CREDENTIALS!
  })

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/auth/login', {
      data: { login: credentials.userAuth.login, password: credentials.userAuth.password },
    })
    expect(res.status(), 'user login').toBeLessThan(400)
  })

  for (const path of STUDIO_ROUTES) {
    test(`GET ${path}`, async ({ page }) => {
      const errors = attachErrorCollectors(page)
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res!.status(), `HTTP status for ${path}`).toBeLessThan(400)
      await page.waitForLoadState('networkidle').catch(() => {})
      expect(errors, `runtime errors on ${path}:\n${errors.join('\n')}`).toEqual([])
    })
  }

  test('GET first character detail (regression: hydration on /studio/characters/[id])', async ({ page }) => {
    test.setTimeout(60_000)
    const errors = attachErrorCollectors(page)
    await page.goto('/studio/characters', { waitUntil: 'load' })

    const editLink = page.locator('a[href^="/studio/characters/"]').first()
    let href: string | null = null
    try {
      await editLink.waitFor({ state: 'attached', timeout: 25_000 })
      href = await editLink.getAttribute('href')
    } catch {
      test.skip(true, 'no character cards rendered within 25s (dev compile or empty list)')
    }
    test.skip(!href || href === '/studio/characters' || !href.includes('/studio/characters/'), 'no characters to test detail page')

    const res = await page.goto(href!, { waitUntil: 'load' })
    expect(res!.status(), `HTTP status for ${href}`).toBeLessThan(400)
    await page.waitForLoadState('networkidle').catch(() => {})

    expect(
      errors,
      `runtime errors on ${href}:\n${errors.join('\n')}`,
    ).toEqual([])
  })

  test('GET new character form (catches asChild hydration)', async ({ page }) => {
    const errors = attachErrorCollectors(page)
    const res = await page.goto('/studio/characters/new', { waitUntil: 'domcontentloaded' })
    expect(res!.status()).toBeLessThan(400)
    await page.waitForLoadState('networkidle').catch(() => {})
    expect(errors, `runtime errors:\n${errors.join('\n')}`).toEqual([])
  })
})
