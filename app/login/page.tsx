'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useSession,getSession } from 'next-auth/react'
import PermissionRedirector from '@/components/custom/PermissionRedirector'
import { useAppDispatch } from '@/hooks/useRedux';
import { setLoaderContent, showLoader, hideLoader } from '@/store/fullPageLoaderSlice';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { signInSchema, SignInSchemaType } from '@/lib/validations'
import Container from '@/components/custom/Container'
import Footer from '@/components/custom/Footer'
import { toast } from "sonner"
import { initAuthUser } from '@/lib/initAuthUser';
import LanguageSwitcher from '@/components/custom/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { PasswordInput } from '@/components/custom/PasswordInput'


export default function SignInPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch();
  const t = useTranslations('SignInPage');
  useEffect(() => {
    dispatch(hideLoader());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInSchemaType) => {
    setError(null);
    dispatch(
      setLoaderContent({
        message: 'Welcome to Duty Hub — Preparing your workspace',
        icon: 'DownloadCloudIcon',
      })
    );
    dispatch(showLoader());
  
    try {
      // Step 1: Sign in
      const res = await signIn('credentials', {
        redirect: false,
        username: data.username,
        password: data.password,
      });
  
      if (!res || !res.ok) {
        toast.error(t('Login failed'));
        console.error('Login failed:', res?.error);
        throw new Error(t('Invalid username or password'));
      }
  
      // Step 2: Wait for session to be updated
      const maxRetries = 100;
      let session;
      for (let i = 0; i < maxRetries; i++) {
        session = await getSession();
        if (session) break;
        await new Promise((resolve) => setTimeout(resolve, 200)); // wait 200ms
      }
  
      if (!session) {
        throw new Error('Session not established after login.');
      }
  
      // Step 3: Now session is ready, fetch user data
      await initAuthUser(dispatch, true);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      // setTimeout(()=>dispatch(hideLoader()),1000)
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/backgrounds/login-bg.jpg')" }}
      >
        {/* Language Switcher Top Right */}
        <motion.div
        className="absolute top-4 right-4 z-20"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        >
            <LanguageSwitcher />
        </motion.div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141e30]/90 to-[#243b55]/90 z-0" />

        {/* Blurred blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[160px] opacity-30 top-[-150px] left-[-100px]" />
          <div className="absolute w-[400px] h-[400px] bg-blue-400 rounded-full blur-[120px] opacity-20 bottom-[-120px] right-[-80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
          className="relative z-10"
        >
          <Container className="w-full max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl">
            <Card className="min-w-[340px] md:min-w-96 shadow-xl backdrop-blur-lg bg-white/90 border border-white/40 rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center mb-6">
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Duty Hub Logo"
                      width={60}
                      height={60}
                      className="mb-2"
                    />
                  </Link>
                  <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
                    Duty Hub
                  </h1>
                </div>

                <motion.form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0 }}
                >
                  <div>
                    <Label htmlFor="username" className="text-gray-700">
                      {t("Username")}
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      {...register('username')}
                      className="mt-1 border-gray-400 bg-white"
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                  <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="Password"
                    isHidden={true}
                    inputClassName='bg-white'
                    {...register('password')}
                    error={errors.password?.message}
                  />
                  </div>

                  {error && (
                    <motion.p
                      className="text-red-600 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-700 text-white transition duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('Logging In')+'...' : t('Log In')}
                  </Button>

                  <Footer
                    footerClasses="bottom-0 w-full py-4 text-center text-xs text-gray-600 overflow-hidden"
                    linkClasses="text-red-600 hover:underline"
                    showVersion={false}
                  />
                </motion.form>
              </CardContent>
            </Card>
          </Container>
        </motion.div>
      </div>

      {/* Redirect when session exists */}
      {session && <PermissionRedirector />}
    </>
  )
}
