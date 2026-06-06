import { AdminShell } from '@/app/admin/_components/admin-shell'
import { HomepageSlideForm } from '@/app/admin/_components/homepage-slide-form'

interface EditHomepageSlidePageProps {
  params: Promise<{ id: string }>
}

export default async function EditHomepageSlidePage({ params }: EditHomepageSlidePageProps) {
  const { id } = await params

  return (
    <AdminShell
      title="Редактировать слайд"
      description="Настройте текст, ссылки, тему и порядок показа на главной."
      backHref="/admin/slider"
    >
      <HomepageSlideForm slideId={id} />
    </AdminShell>
  )
}
