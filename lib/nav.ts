export interface NavItem {
  label: string
  href: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Новости', href: '/news' },
  { label: 'Релизы', href: '/releases' },
  { label: 'Персонажи', href: '/characters' },
  { label: 'Цвета', href: '/colors' },
]
