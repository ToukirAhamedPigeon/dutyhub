'use client'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Nav from './Nav'

export default function SidebarMobileSheet() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 secondary-gradient">
        <SheetHeader className="flex items-start justify-center main-gradient py-2 px-4">
          <SheetTitle>
            <Logo isTitle={true} className="" titleClassName="text-white" />
          </SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <Nav onLinkClick={() => setOpen(false)}/>
        </div>
      </SheetContent>
    </Sheet>
  )
}
