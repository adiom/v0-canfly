import { AdminShell } from '@/app/admin/_components/admin-shell'
import { NewsForm } from '@/app/admin/_components/news-form'

interface EditNewsPageProps {
  params: Promise<{ id: string }>
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params

  return (
    <AdminShell title="Редактирование новости" description="Обновление раздела, заголовка и тега.">
      <NewsForm newsId={id} />
    </AdminShell>
  )
}
