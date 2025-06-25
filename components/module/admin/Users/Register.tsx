'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Dropzone from 'react-dropzone'
import Image from 'next/image'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { checkEmailExists } from '@/lib/validations'
import { useProfilePicture } from '@/hooks/useProfilePicture'
import { authorizationHeader, accessToken } from '@/lib/tokens';
import { useAppSelector } from '@/hooks/useRedux';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.string(),
  image: z.any().optional()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: "Passwords don't match",
})

type FormData = z.infer<typeof schema>


export default function Register() {
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin',
      image: undefined
    }
  })

  const {
    preview,
    clearImage,
    onDrop,
    setPreview
  } = useProfilePicture(setValue, setError, 'image')

  const imagePic = watch('image')
  const email = watch('email')

  // Debounced email validation
  useEffect(() => {
    // if (!email || !email.includes('@')) {
    //   setEmailTaken(false)
    //   return
    // }

    const debounceTimer = setTimeout(async () => {
      // setEmailChecking(true)
      // const exists = await checkEmailExists(email, token)
      // setEmailTaken(exists)
      // setEmailChecking(false)
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [email])

  // Form Submit
  const onSubmit = async (data: FormData) => {
    // Check if email already exists
    // setSubmitLoading(true)
    // const emailTaken = await checkEmailExists(data.email, token)
    // if (emailTaken) {
    //   setError('email', { type: 'manual', message: 'Email already exists' })
    //   setSubmitLoading(false)
    //   return
    // }
  
    // try {
    //   const formData = new FormData()
    //   formData.append('name', data.name)
    //   formData.append('email', data.email)
    //   formData.append('password', data.password)
    //   formData.append('role', data.role)
    //   if (data.image) {
    //     formData.append('image', data.image)
    //   }

    //   const res = await api.post('/users/register', formData, {
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'multipart/form-data'
    //     }
    //   })
  
    //   const result = res.data
  
    //   if (!result) {
    //     // Backend returns a message for display on error
    //     throw new Error(result.message || 'Registration failed')
    //   }
  
    //   // Optionally: show toast or success message
    //   toast.success('User registered successfully!')
  
    //   // Reset form
    //   //handleReset()
    // } catch (error: any) {
    //   toast.error(error.message || 'Something went wrong during registration')
    // } finally {
    //   setSubmitLoading(false)
    // }
  }
  

  // Reset Handler
  const handleReset = () => {
    reset()
    setPreview(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="flex items-center justify-center"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 w-full space-y-4">

        {/* Name Field */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <Input id="name" placeholder="Name" {...register('name')} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
          <div className="relative">
            <Input
              id="email"
              placeholder="Email"
              {...register('email')}
              className={`${emailTaken ? 'border-red-500' : ''} pr-10`}
            />
            {emailChecking && (
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>
          {emailTaken && !errors.email && <p className="text-red-500 text-sm">Email already exists</p>}
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
          <Input type="password" id="password" placeholder="Password" {...register('password')} />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
          <Input type="password" id="confirmPassword" placeholder="Confirm Password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
        </div>

        {/* Role */}
        {/* <div className="space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
          <Select defaultValue={EUserRole.ADMIN} onValueChange={(val) => setValue('role', val as EUserRole)}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EUserRole.ADMIN}>Admin</SelectItem>
              <SelectItem value={EUserRole.USER}>User</SelectItem>
              <SelectItem value={EUserRole.DEVELOPER}>Developer</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
        </div> */}

        {/* Profile Picture */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
          <Dropzone
            onDrop={onDrop}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] }}
            maxFiles={1}
          >
            {({ getRootProps, getInputProps }) => (
              <div
                {...getRootProps()}
                className="border border-dashed p-4 text-center rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-500">Drag & drop or click to select a profile picture</p>

                {preview && (
                  <div className="mt-2 flex flex-col items-center justify-center gap-2">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-md border shadow"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={
                        (e) => {
                          e.stopPropagation()
                          clearImage()
                        }
                      }
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Dropzone>

          {/* Animated Error Message */}
          <AnimatePresence>
            {errors.image?.message && (
              <motion.p
                className="text-red-500 text-sm mt-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {errors.image.message?.toString()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            Reset Form
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={submitLoading}>
            {submitLoading ? 'Registering...' : 'Register User'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
