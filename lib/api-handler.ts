import { NextRequest, NextResponse } from 'next/server'

type HandlerFn = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>

type SimpleHandlerFn = (request: NextRequest) => Promise<NextResponse>

function logError(method: string, path: string, error: unknown) {
  const msg =
    error instanceof Error ? error.message : String(error)
  const stack =
    error instanceof Error ? error.stack : undefined
  console.error(
    `[API] ${method} ${path} → 500: ${msg}`,
    stack ? '\n' + stack : '',
  )
}

export function apiHandler(
  handler: HandlerFn | SimpleHandlerFn,
): HandlerFn {
  return async (request, context) => {
    const method = request.method
    const path = request.nextUrl.pathname
    try {
      const result = await (handler as HandlerFn)(request, context)
      if (result.status >= 500) {
        try {
          const body = await result.clone().json()
          logError(method, path, body.error ?? body)
        } catch {
          logError(method, path, `status ${result.status} (non-JSON body)`)
        }
      }
      return result
    } catch (error) {
      logError(method, path, error)
      const message =
        error instanceof Error ? error.message : 'Internal Server Error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}