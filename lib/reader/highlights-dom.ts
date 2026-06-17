import type { ChapterHighlight, ChapterEditorialNote } from '@/lib/releases-types'

export const PARAGRAPH_TAGS = ['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'li']

/** Собирает параграфы из DOM-дерева root через TreeWalker. */
export function collectParagraphs(root: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_REJECT
      if (PARAGRAPH_TAGS.includes(node.tagName.toLowerCase())) return NodeFilter.FILTER_ACCEPT
      return NodeFilter.FILTER_SKIP
    },
  })
  let node: Node | null = walker.nextNode()
  while (node) {
    result.push(node as HTMLElement)
    node = walker.nextNode()
  }
  return result
}

/** Возвращает индекс параграфа для элемента (по DOM-порядку). */
export function paragraphIndexOf(paragraphs: HTMLElement[], el: HTMLElement): number {
  return paragraphs.indexOf(el)
}

/**
 * Ищет Range для text внутри paragraph.
 * Fallback к контекстному поиску (context_before + префикс text).
 */
export function findTextRange(
  paragraph: HTMLElement,
  text: string,
  contextBefore?: string | null,
): Range | null {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT, null)
  const textNodes: Text[] = []
  let n: Node | null = walker.nextNode()
  while (n) {
    textNodes.push(n as Text)
    n = walker.nextNode()
  }

  for (const node of textNodes) {
    if (node.parentElement?.tagName === 'MARK') continue
    const nodeText = node.textContent ?? ''
    let idx = nodeText.indexOf(text)
    if (idx === -1 && contextBefore) {
      const foundAt = nodeText.indexOf(contextBefore)
      if (foundAt >= 0) {
        const tail = nodeText.slice(foundAt + contextBefore.length, foundAt + contextBefore.length + text.length + 10)
        if (tail.startsWith(text.slice(0, 20))) {
          idx = foundAt + contextBefore.length
        }
      }
    }
    if (idx === -1) continue
    try {
      const range = document.createRange()
      range.setStart(node, idx)
      range.setEnd(node, idx + text.length)
      return range
    } catch {
      // кросс-узел / невалидный offset
    }
  }
  return null
}

/** Применяет стили и hover-эффекты к <mark>. */
export function styleMark(mark: HTMLElement, color: string, idleOpacity: string) {
  mark.style.cursor = 'pointer'
  mark.style.borderRadius = '2px'
  mark.style.padding = '0 1px'
  mark.style.transition = 'background-color 0.15s'
  const idle = `${color}${idleOpacity}`
  mark.style.backgroundColor = idle
  mark.addEventListener('mouseenter', () => { mark.style.backgroundColor = `${color}88` })
  mark.addEventListener('mouseleave', () => { mark.style.backgroundColor = idle })
}

/** Обёртывает highlight в <mark data-cf-hl> внутри paragraph. */
export function wrapHighlight(
  paragraph: HTMLElement,
  hl: ChapterHighlight,
  currentUserId: string | null,
  accent: string,
) {
  const text = hl.text_content
  if (!text) return
  const range = findTextRange(paragraph, text, hl.context_before)
  if (!range) return
  try {
    const mark = document.createElement('mark')
    mark.dataset.cfHl = hl.id
    mark.dataset.cfMine = hl.user_id === currentUserId && !hl.is_public ? 'true' : ''
    styleMark(mark, accent, '44')
    range.surroundContents(mark)
  } catch {
    // skip on cross-node selections
  }
}

/** Обёртывает editorial note в <mark data-cf-en> внутри paragraph. */
export function wrapEditorialNote(paragraph: HTMLElement, en: ChapterEditorialNote) {
  const text = en.text_content
  if (!text) return
  const range = findTextRange(paragraph, text, en.context_before)
  if (!range) return
  try {
    const mark = document.createElement('mark')
    mark.dataset.cfEn = en.id
    const statusColor = en.status === 'open' ? '#e97316' : en.status === 'resolved' ? '#16a34a' : '#6b7280'
    const bgOpacity = en.status === 'open' ? '44' : en.status === 'resolved' ? '28' : '18'
    styleMark(mark, statusColor, bgOpacity)
    range.surroundContents(mark)
  } catch {
    // skip
  }
}

/** Снимает все highlight/editorial-note обёртки с root. */
export function clearHighlightMarks(root: HTMLElement) {
  root.querySelectorAll('mark[data-cf-hl], mark[data-cf-en]').forEach(el => {
    const parent = el.parentNode
    if (!parent) return
    while (el.firstChild) parent.insertBefore(el.firstChild, el)
    parent.removeChild(el)
    parent.normalize()
  })
}

/**
 * Определяет номер страницы (0-indexed) для DOM-элемента
 * внутри CSS multi-column контейнера.
 */
export function pageOfElement(
  el: HTMLElement,
  trackEl: HTMLElement,
  pageWidth: number,
  gutter: number,
  isSpread: boolean,
): number {
  const trackRect = trackEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  // Учитываем текущий transform (translateX) трека
  const matrix = new DOMMatrix(getComputedStyle(trackEl).transform)
  const transformX = matrix.m41
  const elLeft = elRect.left - trackRect.left - transformX
  const colStep = pageWidth + gutter
  const page = Math.max(0, Math.floor(elLeft / colStep))
  if (isSpread && page % 2 !== 0) return Math.max(0, page - 1)
  return page
}
