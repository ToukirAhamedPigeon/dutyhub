// components/Providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import {store} from '@/store';
import { ReactNode } from 'react';


type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </SessionProvider>
  );
}
