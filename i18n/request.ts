import { cookies } from 'next/headers';
import type { RequestConfig } from 'next-intl/server';

export default async function getRequestConfig(): Promise<RequestConfig> {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  const locale = localeFromCookie;

  return {
    locale,
    messages: (await import(`../langs/${locale}.json`)).default,
  };
}
