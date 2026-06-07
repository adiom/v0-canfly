import { test, expect, type Page } from '@playwright/test'

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

const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD

test.describe('smoke: studio routes (admin role)', () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    'Set ADMIN_TEST_EMAIL и ADMIN_TEST_PASSWORD для запуска studio-смоков',
  )

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/auth/login', {
      data: { login: ADMIN_EMAIL, password: ADMIN_PASSWORD },
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

  test('GET first character detail', async ({ page }) => {
    const errors = attachErrorCollectors(page)
    await page.goto('/studio/characters', { waitUntil: 'domcontentloaded' })
    const editLink = page.locator('a[href^="/studio/characters/"]').first()
    const href = await editLink.getAttribute('href')
    test.skip(!href || href === '/studio/characters', 'no characters to test detail page')

    const res = await page.goto(href!, { waitUntil: 'domcontentloaded' })
    expect(res!.status(), `HTTP status for ${href}`).toBeLessThan(400)
    await page.waitForLoadState('networkidle').catch(() => {})
    expect(errors, `runtime errors on ${href}:\n${errors.join('\n')}`).toEqual([])
  })
})
