// app/layout.tsx
import './globals.css';
import { Providers } from '@/components/custom/Providers';
import AuthUserWrapper from '@/components/custom/AuthUserWrapper';
import FullPageLoader from '@/components/custom/FullPageLoader';
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <FullPageLoader />
          <AuthUserWrapper />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
