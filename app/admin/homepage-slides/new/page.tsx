import { AdminShell } from '@/app/admin/_components/admin-shell'
import { HomepageSlideForm } from '@/app/admin/_components/homepage-slide-form'

export default function NewHomepageSlidePage() {
  return (
    <AdminShell
      title="Новый слайд"
      description="Добавьте слайд для hero-слайдера на главной странице Canfly."
      backHref="/admin/slider"
    >
      <HomepageSlideForm />
    </AdminShell>
  )
}
