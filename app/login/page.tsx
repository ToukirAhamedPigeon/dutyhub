// app/login/page.tsx (or pages/login.tsx depending on your structure)
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
// import { useDispatch } from 'react-redux';
import { signIn } from 'next-auth/react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

// import { setPermissions } from '@/store/permissionsSlice';
import { useUserPermissions } from '@/hooks/useUserPermissions'; // your custom hook to fetch permissions
import { useSession } from 'next-auth/react';


const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  // const dispatch = useDispatch();
  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const { data: session } = useSession();
  useUserPermissions(session);

  async function onSubmit(data: LoginFormInputs) {
    try {
      const res = await signIn('credentials', {
        redirect: false,
        username: data.username,
        password: data.password,
      });
  
      if (!res?.ok) {
        throw new Error('Invalid credentials');
      }
  
      // Let useUserPermissions(session) take care of storing permissions
      router.push('/admin/dashboard');
    } catch (error: any) {
      form.setError('root', { message: error.message || 'Login failed' });
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded-md shadow">
      <h1 className="mb-6 text-2xl font-semibold text-center">Login</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show error if login failed */}
          {form.formState.errors.root && (
            <p className="text-red-600 text-sm mb-2">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full mt-4">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
