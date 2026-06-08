import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
  'code', 'pre', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'id', 'rel']

/**
 * Sanitize HTML content before rendering via dangerouslySetInnerHTML.
 * Strips script/style/iframe/event-handler attributes.
 */
export function sanitizeChapterHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ADD_ATTR: ['target'],
    FORCE_BODY: false,
  })
}
