'use client'

import { useAppSelector } from '@/hooks/useRedux';
import Sidebar from '@/components/module/admin/layout/Sidebar'

import { redirect } from 'next/navigation'
import Footer from '@/components/custom/Footer'

import Header from '@/components/module/admin/layout/Header'
import Main from '@/components/module/admin/layout/Main'
import RouteProgress from '@/components/module/admin/layout/RouteProgress'
import { Toaster } from 'sonner'

export default function AdminNavbarLayout({ children }: { children: React.ReactNode }) {
  const authUser = useAppSelector((state) => state.authUser);
  if (!authUser.isAuthenticated) {
    redirect('/login')
  }
  return (
    <>
      <RouteProgress color="#ffffff" />
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header user={authUser} />

        {/* Layout Body */}
        <div className="flex pt-16">
          <Sidebar />
          <Main>
            {children}
          </Main>
        </div>

        <Footer
        footerClasses="w-full py-1 text-center px-4 text-xs text-gray-600 bg-transparent border-t border-gray-200 overflow-hidden flex justify-center md:justify-end"
        linkClasses="text-red-600 hover:underline"
        showVersion={true}
      />
      <Toaster richColors position="top-right" />
      </div>
      </>
  )
}
