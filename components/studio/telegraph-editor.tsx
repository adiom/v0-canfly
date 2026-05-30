'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import { updateChapterAction } from '@/lib/actions/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
  ImageIcon,
} from 'lucide-react'

interface TelegraphEditorProps {
  chapterId: string
  initialTitle: string
  initialContent: string | null
  onSaveStatus?: (status: 'saving' | 'saved' | 'error') => void
}

export function TelegraphEditor({ chapterId, initialTitle, initialContent, onSaveStatus }: TelegraphEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef(initialTitle)
  const lastSavedContent = useRef(initialContent ?? '')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Начните писать...',
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'rounded-md max-w-full mx-auto my-4' },
      }),
    ],
    content: initialContent ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[60vh] px-0 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      scheduleSave(editor.getHTML())
    },
  })

  const save = useCallback(async (content: string, chapterTitle: string) => {
    if (content === lastSavedContent.current && chapterTitle === titleRef.current) return
    onSaveStatus?.('saving')
    try {
      await updateChapterAction(chapterId, { title: chapterTitle, content })
      lastSavedContent.current = content
      titleRef.current = chapterTitle
      onSaveStatus?.('saved')
    } catch {
      onSaveStatus?.('error')
    }
  }, [chapterId, onSaveStatus])

  function scheduleSave(content: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(content, title), 1500)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  function handleTitleBlur() {
    if (title !== titleRef.current && editor) {
      scheduleSave(editor.getHTML())
    }
  }

  function addLink() {
    if (!editor) return
    const url = window.prompt('URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  function addImage() {
    if (!editor) return
    const url = window.prompt('URL изображения:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  if (!editor) return null

  return (
    <div className="mx-auto max-w-2xl">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="mb-6 border-0 bg-transparent px-0 text-3xl font-bold shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
        placeholder="Заголовок главы"
      />

      {editor && (
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-lg">
            <Button
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button variant="ghost" size="icon-sm" onClick={addLink}>
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={addImage}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
