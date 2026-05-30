'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface MobileNavItem {
  label: string
  href: string
}

interface MobileNavProps {
  items: MobileNavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger className="flex h-10 w-10 cursor-pointer touch-manipulation items-center justify-center text-[#f4efe5] hover:text-white lg:hidden" aria-label="Открыть меню">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-[#f4efe5]/10 bg-[#111210] p-0">
        <SheetTitle className="sr-only">Навигация</SheetTitle>
        <div className="flex h-14 items-center border-b border-[#f4efe5]/10 px-4">
          <span className="flex h-9 w-16 items-center justify-center bg-[#d52525] text-lg font-black uppercase tracking-[-0.04em] text-white">
            canfly
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className="flex h-12 items-center rounded-sm px-4 text-sm font-black uppercase tracking-[0.12em] text-[#ded7cc] transition-colors hover:bg-[#f4efe5]/6 hover:text-white"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
