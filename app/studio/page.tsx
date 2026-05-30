import Link from 'next/link'
import { getMyReleases } from '@/lib/actions/studio'
import { ReleaseCard } from '@/components/studio/release-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function StudioDashboard() {
  const releases = await getMyReleases()

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои релизы</h1>
          <p className="mt-1 text-muted-foreground">Управляйте своими произведениями</p>
        </div>
        <Link href="/studio/releases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Новый релиз
          </Button>
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-lg text-muted-foreground">Пока нет релизов</p>
          <Link href="/studio/releases/new" className="mt-4">
            <Button variant="outline">Создать первый релиз</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {releases.map(release => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  )
}
