import { test, expect, type Page, type Route } from '@playwright/test'

const ADMIN_ROUTES = [
  '/admin',
  '/admin/books/new',
  '/admin/characters/new',
  '/admin/news/new',
  '/admin/homepage-slides/new',
  '/admin/slider',
] as const

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

test.describe('smoke: admin routes', () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    'Set ADMIN_TEST_EMAIL и ADMIN_TEST_PASSWORD для запуска admin-смоков',
  )

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/admin/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expect(res.status(), 'admin login').toBeLessThan(400)
  })

  for (const path of ADMIN_ROUTES) {
    test(`GET ${path}`, async ({ page }) => {
      const errors = attachErrorCollectors(page)

      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res!.status(), `HTTP status for ${path}`).toBeLessThan(400)

      await page.waitForLoadState('networkidle').catch(() => {})

      expect(errors, `runtime errors on ${path}:\n${errors.join('\n')}`).toEqual([])
    })
  }
})
