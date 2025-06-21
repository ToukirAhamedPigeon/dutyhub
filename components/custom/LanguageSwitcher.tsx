'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { Button } from '@/components/ui/button'; // shadcn/ui Button
import React from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const nextLocale = locale === 'en' ? 'bn' : 'en';
  const label = nextLocale.toUpperCase();

  const handleLanguageChange = () => {
    Cookie.set('NEXT_LOCALE', nextLocale);
    router.refresh();
  };

  return (
    <Button
      variant="link"
      onClick={handleLanguageChange}
      className="text-sm text-white hover:text-purple-300 transition-colors cursor-pointer"
    >
      {label}
    </Button>
  );
}
