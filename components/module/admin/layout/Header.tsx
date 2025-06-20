'use client';

import React from 'react';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import SidebarMobileSheet from './SidebarMobileSheet';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { adminLayoutUserProps } from '@/types'

type Props = {
    user: adminLayoutUserProps
}

export default function Header({ user }: Props){
    function ToggleSidebarButton() {
        const { toggleCollapse } = useSidebar()
        return (
          <button onClick={toggleCollapse} className=''>
            <Menu className="h-6 w-6 text-white" />
          </button>
        )
      }
    return (
        <nav className="w-full flex items-center justify-between pl-4 py-0 fixed top-0 z-20 shadow-md main-gradient text-white h-16">
            <div className="flex items-center gap-2 py-4">
                <SidebarMobileSheet />
                <div className="hidden lg:flex items-center gap-2 lg:justify-between w-60">
                <Logo isTitle titleClassName="text-white" />
                <ToggleSidebarButton />
                </div>
            </div>
            <Logo isTitle={false} className="lg:hidden py-4" />
            <div className="flex items-center gap-2 h-full px-4 bg-white/30 backdrop-blur-sm text-gray-800">
                <UserDropdown user={user} />
            </div>
        </nav>
    );
};