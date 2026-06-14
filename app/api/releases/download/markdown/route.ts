import { NextRequest, NextResponse } from 'next/server'
import { fetchReleaseById } from '@/lib/server/releases'
import { fetchEditionById } from '@/lib/server/editions'
import { fetchPublishedChaptersByEdition } from '@/lib/server/chapters'

function stripHtmlTags(html: string): string {
  let text = html
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]/gi, (_, level, content) => {
    const hashes = '#'.repeat(Number(level))
    return `${hashes} ${content}`
  })
  text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, content) => {
    return content.split('\n').map((l: string) => `> ${l}`).join('\n')
  })
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
  text = text.replace(/<(ul|ol)[^>]*>/gi, '')
  text = text.replace(/<\/(ul|ol)>/gi, '')
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  text = text.replace(/<hr[^>]*>/gi, '\n---\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  return text
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const releaseId = searchParams.get('releaseId')
  const editionId = searchParams.get('editionId')

  if (!releaseId || !editionId) {
    return NextResponse.json({ error: 'releaseId и editionId обязательны' }, { status: 400 })
  }

  const release = await fetchReleaseById(releaseId)
  if (!release || release.status !== 'published') {
    return NextResponse.json({ error: 'Релиз не найден или не опубликован' }, { status: 404 })
  }

  const edition = await fetchEditionById(editionId)
  if (!edition || edition.status !== 'published') {
    return NextResponse.json({ error: 'Издание не найдено или не опубликовано' }, { status: 404 })
  }

  const chapters = await fetchPublishedChaptersByEdition(editionId)
  if (chapters.length === 0) {
    return NextResponse.json({ error: 'Нет опубликованных глав' }, { status: 404 })
  }

  let markdown = `# ${release.title}\n\n`

  if (release.annotation) {
    markdown += `${stripHtmlTags(release.annotation)}\n\n---\n\n`
  }

  for (const chapter of chapters) {
    if (chapters.length > 1) {
      markdown += `## ${chapter.title}\n\n`
    }
    if (chapter.content) {
      markdown += `${stripHtmlTags(chapter.content)}\n\n`
    }
  }

  const filename = `${release.slug}.md`

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
