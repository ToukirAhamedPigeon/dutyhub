'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Dropzone from 'react-dropzone'
import Image from 'next/image'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { checkValueExists } from '@/lib/validations'
import { useProfilePicture } from '@/hooks/useProfilePicture'
import { authorizationHeader, accessToken } from '@/lib/tokens';
import { useAppSelector } from '@/hooks/useRedux';
import DateTimeInput,{BasicInput, CustomSelect, PasswordInput, UniqueInput} from '@/components/custom/FormInputs'
import { bloodGroups } from '@/constants'

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string(),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmed_password: z.string().min(1, 'Confirmed password is required'),
  image: z.string().optional(),
  bp_no: z.string().optional(),
  phone_1: z.string().optional(),
  phone_2: z.string().optional(),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  nid: z.string().optional(),
  dob: z.coerce.date().optional(),
  description: z.string().optional(),
  current_status: z.string().min(1, 'Status is required'),
  role_ids: z
    .array(
      z.string().regex(objectIdRegex, {
        message: "Each role ID must be a valid ObjectId",
      })
    )
    .nonempty({ message: "Please select at least one role" }),
    permission_ids: z
    .array(
      z.string().regex(objectIdRegex, {
        message: "Each permission ID must be a valid ObjectId",
      })
    )
}).refine(
  (data) => data.password === data.confirmed_password,
  {
    path: ['confirmed_password'],
    message: "Passwords don't match",
  }
);

type FormData = z.infer<typeof schema>


export default function Register() {
  const [submitLoading, setSubmitLoading] = useState(false)
  const model='User'

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
      username: '',
      email: '',
      password: '',
      confirmed_password: '',
      image: '',
      bp_no: '',
      phone_1: '',
      phone_2: '',
      address: '',
      blood_group: '',
      nid: '',
      dob: new Date(),
      description: '',
      current_status: 'Active',
      role_ids: [],
      permission_ids: []
    }
  })

  const {
    preview,
    clearImage,
    onDrop,
    setPreview
  } = useProfilePicture(setValue, setError, 'image')

  const imagePic = watch('image')

  // Form Submit
  const onSubmit = async (data: FormData) => {
    // Check if email already exists
    setSubmitLoading(true)
      const usernameTaken = await checkValueExists("User", "username", data.username)
      if (usernameTaken) {
        setError('username', { type: 'manual', message: 'Username already exists' })
        setSubmitLoading(false)
        return
      }

      if(data.bp_no && data.bp_no.trim().length>0)
      {
        const bo_no_Taken = await checkValueExists("User", "bp_no", data.bp_no)
        if (bo_no_Taken) {
          setError('bp_no', { type: 'manual', message: 'BP No already exists' })
          setSubmitLoading(false)
          return
        }
      }    
  
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

      {/* Name + Username */}
      <div className="flex flex-col md:flex-row gap-4">
        <BasicInput
        id="name"
        label="Name"
        isRequired
        placeholder="Name"
        register={register("name", { required: "Name is required" })}
        error={errors.name}
        model={model}
      />
       <UniqueInput
            id="username"
            label="Username"
            placeholder="Username"
            model={model}
            isRequired={true}
            register={register('username')}
            error={errors.username}
            uniqueErrorMessage="Username already exists"
            field="username"
            watchValue={watch('username')}
          />
      </div>

      {/* Password + Confirm Password */}
      <div className="flex flex-col md:flex-row gap-4">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Password"
            isRequiredStar={true}
            isHidden={false}
            {...register('password')}
            error={errors.password?.message}
            model={model}
          />
          <PasswordInput
            id="confirmed_password"
            label="Confirm Password"
            placeholder="Confirm Password"
            isRequiredStar={true}
            isHidden={false}
            {...register('confirmed_password')}
            error={errors.confirmed_password?.message}
            model={model}
          />
      </div>

      {/*  BP No + Email */}
      <div className="flex flex-col md:flex-row gap-4">
        <UniqueInput
            id="bp_no"
            label="BP No"
            placeholder="BP No"
            model={model}
            register={register('bp_no')}
            error={errors.bp_no}
            uniqueErrorMessage="BP No already exists"
            field="bp_no"
            watchValue={watch('bp_no') ?? ''}
          />

      <UniqueInput
          id="email"
          label="Email"
          placeholder="Email"
          model={model}
          register={register('email')}
          error={errors.email}
          uniqueErrorMessage="Email already exists"
          field="email"
          watchValue={watch('email')}
        />
      </div>

        {/* Phone 1 + Phone 2 */}
        <div className="flex flex-col md:flex-row gap-4">
          <BasicInput
            id="phone_1"
            label="Phone 1"
            type="number"
            isRequired={true}
            placeholder="Phone 1"
            register={register("phone_1")}
            error={errors.phone_1}
            model={model}
            onWheel={(e) => e.currentTarget.blur()}
          />
          <BasicInput
            id="phone_2"
            label="Phone 2"
            type="number"
            placeholder="Phone 2"
            register={register("phone_2")}
            error={errors.phone_2}
            model={model}
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>

        {/* Blood Group + Current Status */}
        <div className="flex flex-col md:flex-row gap-4">
          <CustomSelect<FormData>
            id="current_status"
            label="Current Status"
            name="current_status"
            placeholder="Select Current Status"
            isRequired={true}
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
            error={errors.current_status}
            setValue={setValue}
            value={watch("current_status")}
            model={model}
          />
          <CustomSelect<FormData>
            id="role_ids"
            label="Roles"
            name="role_ids"
            setValue={setValue}
            model="User"
            apiUrl="/get-options"
            collection="Role"
            labelFields={["name"]}
            valueFields={["_id"]}
            sortOrder="asc"
            isRequired={true}
            placeholder="Select Roles"
            multiple={true}
            value={watch("role_ids")}
            error={errors.role_ids?.[0]}
          />
          <CustomSelect<FormData>
            id="blood_group"
            label="Blood Group"
            name="blood_group"
            placeholder="Select Blood Group"
            isRequired={false}
            options={bloodGroups}
            error={errors.blood_group}
            setValue={setValue}
            model={model}
            value={watch('blood_group')}
            defaultOption={{ label: 'None', value: '' }}
          />
        </div>

        <CustomSelect<FormData>
            id="permission_ids"
            label="Permissions"
            name="permission_ids"
            setValue={setValue}
            model="User"
            apiUrl="/get-options"
            collection="Permission"
            labelFields={["name"]}
            valueFields={["_id"]}
            sortOrder="asc"
            isRequired={false}
            placeholder="Select Permissions"
            multiple={true}
            value={watch("permission_ids")}
            error={errors.permission_ids?.[0]}
          />

        {/* DOB + NID */}
        <div className="flex flex-col md:flex-row gap-4">
          <DateTimeInput
            id="dob"
            label="Date of Birth"
            name="dob"
            value={watch('dob') ?? null}
            setValue={(field: string, value: Date | null) => setValue(field as any, value)}
            error={errors.dob}
            placeholder="Select your date of birth"
            showTime={false}
            model={model}
          />
          <BasicInput
            id="nid"
            label="NID"
            placeholder="NID"
            register={register("nid")}
            error={errors.nid}
            model={model}
          />
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
                className="border border-dashed border-gray-400 p-4 text-center rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Dropzone>
          <AnimatePresence>
            {errors.image?.message && (
              <motion.p
                className="text-red-500 text-sm mt-1"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {errors.image.message.toString()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea {...register('address')} className="w-full border rounded-md p-2 text-sm" rows={2} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea {...register('description')} className="w-full border rounded-md p-2 text-sm" rows={2} />
        </div>

        {/* Submit Actions */}
        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
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
