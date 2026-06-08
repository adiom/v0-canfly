import { AdminShell } from '@/app/admin/_components/admin-shell'
import { BookForm } from '@/app/admin/_components/book-form'

export default function NewBookPage() {
  return (
    <AdminShell title="Новая книга" description="Создание книги, комикса или аудиокниги для каталога.">
      <BookForm />
    </AdminShell>
  )
}

