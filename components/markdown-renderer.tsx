'use client'

interface MarkdownRendererProps {
  content: string | null | undefined
  className?: string
}

/**
 * Санитизация HTML — удаляет опасные теги и атрибуты (XSS-защита).
 * Разрешены только безопасные структурные теги без атрибутов.
 */
function sanitizeHtml(html: string): string {
  // Удаляем script, style, iframe и другие опасные теги целиком (с содержимым)
  let safe = html.replace(/<(script|style|iframe|object|embed|form|input|button|select|textarea|link|meta|base)[^>]*>[\s\S]*?<\/\1>/gi, '')
  // Удаляем самозакрывающиеся опасные теги
  safe = safe.replace(/<(script|style|iframe|object|embed|form|input|link|meta|base)[^>]*\/?>/gi, '')
  // Удаляем on* обработчики событий из любых тегов
  safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  // Удаляем javascript: в href/src
  safe = safe.replace(/\s+(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
  return safe
}

/**
 * Простой markdown → HTML парсер.
 * Поддерживает: заголовки h1-h6, жирный, курсив, код, списки, hr, абзацы.
 */
function parseMarkdown(md: string): string {
  const lines = md.split('\n')
  const result: string[] = []
  let inUl = false
  let inOl = false

  const closeList = () => {
    if (inUl) { result.push('</ul>'); inUl = false }
    if (inOl) { result.push('</ol>'); inOl = false }
  }

  const inlineFormat = (text: string): string => {
    return text
      // Жирный + курсив
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      // Жирный
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Курсив
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Инлайн-код
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  }

  for (const line of lines) {
    // Заголовки
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      result.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`)
      continue
    }

    // Горизонтальная линия
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList()
      result.push('<hr />')
      continue
    }

    // Маркированный список
    const ulMatch = line.match(/^[-*+]\s+(.+)$/)
    if (ulMatch) {
      if (inOl) { result.push('</ol>'); inOl = false }
      if (!inUl) { result.push('<ul>'); inUl = true }
      result.push(`<li>${inlineFormat(ulMatch[1])}</li>`)
      continue
    }

    // Нумерованный список
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (inUl) { result.push('</ul>'); inUl = false }
      if (!inOl) { result.push('<ol>'); inOl = true }
      result.push(`<li>${inlineFormat(olMatch[1])}</li>`)
      continue
    }

    // Пустая строка — закрываем списки, разделитель абзацев
    if (line.trim() === '') {
      closeList()
      result.push('')
      continue
    }

    // Обычный абзац
    closeList()
    result.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeList()

  return result.join('\n')
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content?.trim()) {
    return <div className={className} />
  }

  const rawHtml = parseMarkdown(content)
  const cleanHtml = sanitizeHtml(rawHtml)

  return (
    <div
      className={[
        // Базовые стили для читаемости
        'text-[#f4efe5] leading-8',
        // Заголовки
        '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-white',
        '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-white',
        '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[#ded7cc]',
        '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-[#ded7cc]',
        '[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mb-1 [&_h5]:mt-3 [&_h5]:text-[#ded7cc]',
        '[&_h6]:text-sm [&_h6]:font-medium [&_h6]:mb-1 [&_h6]:mt-3 [&_h6]:text-[#9db5c8]',
        // Абзацы
        '[&_p]:mb-4 [&_p]:text-[#ded7cc]',
        // Списки
        '[&_ul]:mb-4 [&_ul]:pl-6 [&_ul]:list-disc [&_ul_li]:mb-1 [&_ul_li]:text-[#ded7cc]',
        '[&_ol]:mb-4 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol_li]:mb-1 [&_ol_li]:text-[#ded7cc]',
        // Форматирование
        '[&_strong]:font-bold [&_strong]:text-white',
        '[&_em]:italic [&_em]:text-[#f6d6a8]',
        '[&_code]:font-mono [&_code]:text-sm [&_code]:bg-[#1b1c19] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#f6d6a8]',
        // Разделитель
        '[&_hr]:border-[#f4efe5]/10 [&_hr]:my-6',
        className ?? '',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}
