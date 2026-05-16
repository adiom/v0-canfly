import { AdminShell } from '@/app/admin/_components/admin-shell'
import { CharacterForm } from '@/app/admin/_components/character-form'

export default function NewCharacterPage() {
  return (
    <AdminShell title="Новый персонаж" description="Создание карточки персонажа для сайта.">
      <CharacterForm />
    </AdminShell>
  )
}

