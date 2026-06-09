import Link from 'next/link'
import { getMyReleases } from '@/lib/actions/studio'
import { requireStudioSession } from '@/lib/server/studio-auth'
import { ReleaseCard } from '@/components/studio/release-card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Globe, Eye, Sparkles } from 'lucide-react'

function StatCard({ label, value, icon: Icon, gradient }: { label: string; value: number | string; icon: React.ElementType; gradient: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm shadow-black/5 transition-all duration-300 hover:bg-white/80 hover:shadow-md hover:shadow-black/8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${gradient} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export default async function StudioDashboard() {
  const session = await requireStudioSession()
  const isAdmin = session?.roles.includes('admin') ?? false
  const releases = await getMyReleases()

  const published = releases.filter(r => r.status === 'published')
  const totalViews = releases.reduce((sum, r) => sum + r.view_count, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isAdmin ? 'Все релизы' : 'Мои релизы'}</h1>
          <p className="mt-1 text-gray-500">{isAdmin ? 'Все произведения на платформе' : 'Управляйте своими произведениями'}</p>
        </div>
        <Link href="/studio/releases/new">
          <Button className="h-11 px-5 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:from-violet-700 hover:to-violet-600">
            <Plus className="mr-2 h-4 w-4" />
            Новый релиз
          </Button>
        </Link>
      </div>

      {releases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Всего релизов" value={releases.length} icon={BookOpen} gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
          <StatCard label="Опубликовано" value={published.length} icon={Globe} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
          <StatCard label="Просмотры" value={totalViews} icon={Eye} gradient="bg-gradient-to-br from-amber-500 to-amber-700" />
        </div>
      )}

      {releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200/80 bg-white/30 backdrop-blur-sm py-20">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 mb-4">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Пока нет релизов</p>
          <p className="mt-1 text-sm text-gray-400">Создайте свой первый релиз</p>
          <Link href="/studio/releases/new" className="mt-6">
            <Button className="h-11 px-6 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:from-violet-700 hover:to-violet-600">
              <Plus className="mr-2 h-4 w-4" />
              Создать первый релиз
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {releases.map(release => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  )
}