// app/layout.tsx
import './globals.css';
import { Providers } from '@/components/custom/Providers';
import AuthUserWrapper from '@/components/custom/AuthUserWrapper';
import FullPageLoader from '@/components/custom/FullPageLoader';
import { Toaster } from "@/components/ui/sonner"
import { NextIntlClientProvider } from 'next-intl';
import getRequestConfig from '@/i18n/request';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, messages } = await getRequestConfig();
  return (
    <html lang={locale}>
      <body>
        <Providers>
        <NextIntlClientProvider  locale={locale} messages={messages}>
          <FullPageLoader />
          <AuthUserWrapper />
          {children}
          <Toaster />
        </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
