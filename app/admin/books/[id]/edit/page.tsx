import { AdminShell } from '@/app/admin/_components/admin-shell'
import { BookForm } from '@/app/admin/_components/book-form'

interface EditBookPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id } = await params

  return (
    <AdminShell title="Редактирование книги" description="Обновление карточки книги, цены, ссылок и страниц предпросмотра.">
      <BookForm bookId={id} />
    </AdminShell>
  )
}

