import { redirect } from 'next/navigation'
import { requireStudioSession } from '@/lib/server/studio-auth'
import { SidebarProvider } from '@/components/ui/sidebar'
import { StudioSidebar } from '@/components/studio/studio-sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudioSession()
  if (!session) redirect('/login')

  const isAdmin = session.roles.includes('admin')

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <StudioSidebar user={session.user} isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

