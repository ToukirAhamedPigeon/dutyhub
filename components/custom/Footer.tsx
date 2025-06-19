'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function Footer({ footerClasses, linkClasses, showVersion = false }: { footerClasses: string, linkClasses: string, showVersion: boolean }) {
  return (
    <footer className={cn(footerClasses)}>
      <span className='text-[10px]'>Developed by</span>&nbsp;
      <Link href="https://pigeonic.com" target="_blank" className={linkClasses}>
        Pigeonic
      </Link>
      {showVersion && <span className='hidden md:block'>
        &nbsp;&nbsp;&nbsp;<small className='font-bold text-[10px]'>v1.0.0</small>
      </span>}
    </footer>
  )
}
