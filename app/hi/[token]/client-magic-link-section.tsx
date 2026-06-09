'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

interface ClientMagicLinkSectionProps {
  email: string
}

export function ClientMagicLinkSection({ email }: ClientMagicLinkSectionProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await signIn('credentials', {
        email,
        redirect: false,
      })

      if (!result?.error) {
        await updateSession()
      }

      router.push('/profile')
      router.refresh()
    }, 3000)

    return () => clearTimeout(timer)
  }, [email, router, updateSession])

  return null
}
