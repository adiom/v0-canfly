import { AdminShell } from '@/app/admin/_components/admin-shell'
import { NewsForm } from '@/app/admin/_components/news-form'

export default function NewNewsPage() {
  return (
    <AdminShell title="Новая новость" description="Создание записи для раздела новостей на главной.">
      <NewsForm />
    </AdminShell>
  )
}
