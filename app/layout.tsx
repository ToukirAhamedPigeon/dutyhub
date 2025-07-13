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
      <body suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <FullPageLoader />
            <AuthUserWrapper />
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </Providers>

        {/* ⬇️ Required for react-datepicker portal to work properly */}
        <div
          id="datepicker-portal"
          className="fixed top-0 left-0 w-full h-full z-[9999] pointer-events-none"
        />
      </body>
    </html>
  );
}
