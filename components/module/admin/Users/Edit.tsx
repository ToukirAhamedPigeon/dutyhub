'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { EUserRole, IUser } from '@/types'
import Dropzone from 'react-dropzone'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { checkEmailExists } from '@/lib/validations'
import { useProfilePicture } from '@/hooks/useProfilePicture'
const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(EUserRole),
    isActive: z.string(),
    profilePicture: z.any().optional()
  })

type FormData = z.infer<typeof schema>

const authUser = localStorage.getItem('authUser')
const token = JSON.parse(authUser || '{}').token

type EditUserFormProps = {
  user: IUser
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserForm({ user, onClose, onSuccess }: EditUserFormProps) {
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      password: user.decryptedPassword,
      isActive: user.isActive ? 'active' : 'inactive',
    },
  })

  useEffect(() => {
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('role', user.role)
    setValue('profilePicture', user.profilePicture)
    setValue('password', user.decryptedPassword)
    setValue('isActive', user.isActive ? 'active' : 'inactive')
    if (user.profilePicture) {
      setPreview(user.profilePicture.imageUrl)
    }
  }, [user, setValue])

  const {
    preview,
    isImageDeleted,
    clearImage,
    onDrop,
    setIsImageDeleted,
    setPreview
  } = useProfilePicture(setValue, setError, 'profilePicture')

  const profilePic = watch('profilePicture')
  const email = watch('email')

  // Debounced email validation
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailTaken(false)
      return
    }

    const debounceTimer = setTimeout(async () => {
      setEmailChecking(true)
      const exists = await checkEmailExists(email, token, user._id.toString(), '_id')
      setEmailTaken(exists)
      setEmailChecking(false)
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [email])


  const onSubmit = async (data: FormData) => {
    const emailTaken = await checkEmailExists(data.email, token, user._id.toString(), '_id')
    if (emailTaken) {
      setError('email', { type: 'manual', message: 'Email already exists' })
      setSubmitLoading(false)
      return
    }
    try {
        setSubmitLoading(true)
        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('email', data.email)
        formData.append('role', data.role)
        formData.append('password', data.password)
        formData.append('isActive', data.isActive === 'active' ? 'true' : 'false')
        formData.append('isImageDeleted', isImageDeleted.toString())
    
      if (data.profilePicture) {
        formData.append('profilePicture', data.profilePicture)
      }
      const res = await api.put(`/users/${user._id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('User updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       <div className="flex flex-col md:flex-row gap-2">
        {/* Name Field */}
            <div className="w-full md:w-1/2 space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <Input id="name" placeholder="Name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
          {/* Email Field */}
            <div className="w-full md:w-1/2 space-y-1">
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
        </div>

        
        <div className="flex flex-col md:flex-row gap-2">
        {/* Password */}
        <div className="w-full md:w-1/3 space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
          <Input type="password" id="password" placeholder="Password" {...register('password')} />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        {/* Role */}
        <div className="w-full md:w-1/3 space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
          <Select defaultValue={user.role} onValueChange={(val) => setValue('role', val as EUserRole)}>
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
        </div>
            {/* Status */}
            <div className="w-full md:w-1/3 space-y-1">
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
            <Select defaultValue={user.isActive ? 'active' : 'inactive'} onValueChange={(val) => setValue('isActive', val)}>
                <SelectTrigger id="isActive">
                <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
            {errors.isActive && <p className="text-red-500 text-sm">{errors.isActive.message}</p>}
            </div>
        </div>

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
            {errors.profilePicture?.message && (
              <motion.p
                className="text-red-500 text-sm mt-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {errors.profilePicture.message?.toString()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      {/* Submit */}
      <hr className="border-t border-gray-200" />
      <div className="flex justify-center">
        <Button variant="warning" type="submit" disabled={isSubmitting || submitLoading}>
          {isSubmitting || submitLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
