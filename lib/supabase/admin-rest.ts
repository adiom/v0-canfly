function getAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured')
  }

  return { supabaseUrl, serviceRoleKey }
}

export async function supabaseAdminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { supabaseUrl, serviceRoleKey } = getAdminConfig()
  const url = new URL(path, supabaseUrl)

  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const detail = await response.text()

  if (!response.ok) {
    throw new Error(detail || `Supabase admin request failed with ${response.status}`)
  }

  if (!detail) {
    return undefined as T
  }

  return JSON.parse(detail) as T
}

export async function findAdminByEmail(email: string) {
  const searchParams = new URLSearchParams({
    select: 'email',
    email: `eq.${email}`,
    limit: '1',
  })

  const admins = await supabaseAdminRequest<Array<{ email: string }>>(
    `/rest/v1/admins?${searchParams.toString()}`,
  )

  return admins[0] || null
}
