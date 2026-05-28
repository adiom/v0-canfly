'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, UserCheck, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface CharacterFriendButtonProps {
  characterSlug: string
  canReceiveMessages: boolean
}

export function CharacterFriendButton({
  characterSlug,
  canReceiveMessages,
}: CharacterFriendButtonProps) {
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadFriendship = async () => {
      try {
        const response = await fetch(`/api/characters/${characterSlug}/friendship`)
        const payload = await response.json()

        if (active) {
          setFriendshipStatus(payload.data?.friendship?.status || null)
        }
      } catch {
        if (active) setFriendshipStatus(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadFriendship()

    return () => {
      active = false
    }
  }, [characterSlug])

  const addFriend = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/characters/${characterSlug}/friendship`, {
        method: 'POST',
      })
      const payload = await response.json()
      setFriendshipStatus(payload.data?.friendship?.status || null)
    } finally {
      setLoading(false)
    }
  }

  const isFriend = friendshipStatus === 'accepted'

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        onClick={addFriend}
        disabled={loading || isFriend}
        className="h-12 bg-[#d52525] px-5 text-sm font-black uppercase text-white hover:bg-[#b91f1f]"
      >
        {isFriend ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
        {isFriend ? 'В друзьях' : loading ? 'Проверка...' : 'Добавить в друзья'}
      </Button>

      {canReceiveMessages ? (
        <Button
          asChild
          variant="outline"
          className="h-12 border-[#f4efe5]/15 bg-transparent px-5 text-sm font-black uppercase text-[#f4efe5] hover:border-[#f6d6a8]/45 hover:bg-[#f6d6a8]/10"
        >
          <Link href={`/characters/${characterSlug}/chat`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Написать
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-12 border-[#f4efe5]/15 bg-transparent px-5 text-sm font-black uppercase text-[#f4efe5]"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Недоступно
        </Button>
      )}
    </div>
  )
}
