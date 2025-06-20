'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
export default function Logo({isTitle, className, titleClassName}: {isTitle: boolean, className?: string, titleClassName?: string}){
    return (
        <Link href="/" className={cn('flex items-center gap-3', className)}>
            <Image src="/icons/icon-192x192.png" alt="Logo" width={32} height={32}  />
            {isTitle && <span className={cn("text-lg font-semibold", titleClassName)}>In-Parking</span>}
        </Link>
    );
};