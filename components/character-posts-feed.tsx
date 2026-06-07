'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'

export interface CharacterPost {
  id: string
  content: string
  post_type: 'thought' | 'announcement' | 'question'
  image_url?: string
  created_at: string
  character: {
    id: string
    name: string
    slug: string
    avatar: string | null
  }
}

interface PostsFeedProps {
  characterSlug?: string
}

export function CharacterPostsFeed({ characterSlug }: PostsFeedProps) {
  const [posts, setPosts] = useState<CharacterPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const url = new URL('/api/characters/posts', window.location.origin)
        if (characterSlug) {
          url.searchParams.append('character', characterSlug)
        }
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [characterSlug])

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Загрузка постов...</div>
  }

  if (posts.length === 0) {
    return <div className="text-center text-slate-400 py-8">Пока нет постов</div>
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-600 bg-slate-700">
                {post.character.avatar ? (
                  <Image
                    src={post.character.avatar}
                    alt={post.character.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-300">
                    {post.character.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">{post.character.name}</h3>
                <p className="text-sm text-slate-400">
                  {new Date(post.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  post.post_type === 'announcement'
                    ? 'bg-blue-900/50 text-blue-300'
                    : post.post_type === 'question'
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : 'bg-purple-900/50 text-purple-300'
                }`}>
                  {post.post_type === 'announcement' ? '📢 Анонс' : post.post_type === 'question' ? '❓ Вопрос' : '💭 Мысль'}
                </span>
              </div>
            </div>

            {/* Content */}
            <p className="text-slate-200 mb-4 leading-relaxed">{post.content}</p>

            {/* Image */}
            {post.image_url && (
              <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={post.image_url}
                  alt="Post image"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-6 pt-4 border-t border-slate-700/50 text-sm text-slate-400">
              <button className="hover:text-slate-200 transition-colors">❤️ Нравится</button>
              <button className="hover:text-slate-200 transition-colors">💬 Ответить</button>
              <button className="hover:text-slate-200 transition-colors">🔁 Поделиться</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
