'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import React from 'react';

export default function Main({ children }: { children: React.ReactNode }){
    const { isCollapsed } = useSidebar()
    return (
        <main className={`flex-grow ml-0 p-4 transition-all duration-300 bg-gradient-to-r from-[#fdfbfb] to-[#ebedee] ${isCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}
            style={{ minHeight: 'calc(100vh - 5rem - 10px)', overflowY: 'auto' }}>
            {children}
        </main>
    );
};