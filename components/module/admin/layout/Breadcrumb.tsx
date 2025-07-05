'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type Crumb = {
  label: string;
  href?: string; // if undefined, it's the current page
};

type BreadcrumbProps = {
  items: Crumb[];
  title?: string;
  showTitle?: boolean;
  className?: string;
};

export default function Breadcrumb({
  items,
  title = '',
  showTitle = true,
  className = '',
}: BreadcrumbProps) {
  const t = useTranslations();
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-4", className)}>
      {showTitle && (
        <h1 className="text-lg md:text-xl font-bold text-gray-800">{t(title)}</h1>
      )}
     {items.length > 0 && <nav className="flex items-center text-xs md:text-sm text-gray-800 flex-wrap gap-x-2">
        <Link
          href="/admin/dashboard"
          className="hover:underline flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
        </Link>

        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-gray-800/50">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="hover:underline text-gray-800/90"
              >
                {t(item.label)}
              </Link>
            ) : (
              <span className="text-gray-800 font-semibold">{t(item.label)}</span>
            )}
          </div>
        ))}
      </nav>}
    </div>
  );
}
