'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { accessToken } from '@/lib/tokens'
import { useProfilePicture } from '@/hooks/useProfilePicture'
import DateTimeInput, {
  BasicInput,
  BasicTextarea,
  CustomSelect,
  SingleImageInput,
  UniqueInput,
} from '@/components/custom/FormInputs'
import { bloodGroups } from '@/constants'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

const schema = z.object({
  _id: z.string().regex(objectIdRegex, 'Invalid user ID'),
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email({ message: 'Invalid email' }),
  image: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.type.startsWith('image/'), {
      message: 'Only image files are allowed',
    }),
  bp_no: z.string().optional(),
  phone_1: z.string().min(11, 'Phone Number must be at least 11 digits').optional(),
  phone_2: z.string().optional(),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  nid: z.string().optional(),
  dob: z.coerce.date().optional(),
  description: z.string().optional(),
  current_status: z.string().min(1, 'Status is required'),
  role_ids: z
    .array(z.string().regex(objectIdRegex, { message: 'Invalid role ID' }))
    .nonempty({ message: 'Select at least one role' }),
  permission_ids: z
    .array(z.string().regex(objectIdRegex, { message: 'Invalid permission ID' }))
    .optional(),
})

type FormData = z.infer<typeof schema>

interface EditUserProps {
  user: any
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditUser({ user, fetchData, onClose }: EditUserProps) {
  const token = accessToken()
  const [submitLoading, setSubmitLoading] = useState(false)
  const model = 'User'

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...user,
      dob: user.dob ? new Date(user.dob) : undefined,
      image: undefined,
    },
  })

  const { preview, clearImage, onDrop } = useProfilePicture(setValue, setError, 'image', watch('image'))

  useEffect(() => {
    if (user) {
      reset({
        ...user,
        role_ids: user.role_ids?.map((r:any) => typeof r === 'string' ? r : r._id) || [],
      });
    }
  }, [user]);

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('username', data.username)
      formData.append('email', data.email)
      formData.append('current_status', data.current_status)
      formData.append('dob', data.dob?.toISOString() ?? '')

      if (data.image) formData.append('image', data.image)
      if (data.bp_no) formData.append('bp_no', data.bp_no)
      if (data.phone_1) formData.append('phone_1', data.phone_1)
      if (data.phone_2) formData.append('phone_2', data.phone_2)
      if (data.address) formData.append('address', data.address)
      if (data.blood_group) formData.append('blood_group', data.blood_group)
      if (data.nid) formData.append('nid', data.nid)
      if (data.description) formData.append('description', data.description)

      formData.append('role_ids', JSON.stringify(data.role_ids))
      formData.append('permission_ids', JSON.stringify(data.permission_ids || []))

      const res = await api.patch(`/users/${data._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!res.data.success) throw new Error(res.data.message || 'Update failed')

      toast.success('User updated successfully!', {
        style: { background: 'green', color: 'white' },
      })

      await fetchData()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => reset()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 w-full space-y-4">

        <div className="flex flex-col md:flex-row gap-4">
          <BasicInput id="name" label="Name" isRequired placeholder="Name" register={register('name')} error={errors.name} model={model} />
          <UniqueInput
            id="username"
            label="Username"
            placeholder="Username"
            model={model}
            isRequired
            register={register('username')}
            error={errors.username}
            field="username"
            watchValue={watch('username')}
            uniqueErrorMessage="Username already exists"
            exceptFieldValue={user._id}
            exceptFieldName="_id"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
        <UniqueInput
          id="email"
          label="Email"
          placeholder="Email"
          model={model}
          isRequired
          register={register('email')}
          error={errors.email}
          field="email"
          watchValue={watch('email')}
          uniqueErrorMessage="Email already in use"
          exceptFieldValue={user._id}
          exceptFieldName="_id"
        />
          <UniqueInput
            id="bp_no"
            label="BP No"
            placeholder="BP No"
            model={model}
            register={register('bp_no')}
            error={errors.bp_no}
            field="bp_no"
            watchValue={watch('bp_no') ?? ''}
            uniqueErrorMessage="BP No must be unique"
            exceptFieldValue={user._id}
            exceptFieldName="_id"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <BasicInput id="phone_1" label="Phone 1" type="number" isRequired placeholder="Phone 1" register={register('phone_1')} error={errors.phone_1} model={model} onWheel={(e) => e.currentTarget.blur()} />
          <BasicInput id="phone_2" label="Phone 2" type="number" placeholder="Phone 2" register={register('phone_2')} error={errors.phone_2} model={model} onWheel={(e) => e.currentTarget.blur()} />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <CustomSelect<FormData> id="current_status" label="Current Status" name="current_status" placeholder="Select Status" isRequired options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} error={errors.current_status} setValue={setValue} value={watch('current_status')} model={model} />
          <CustomSelect<FormData> id="role_ids" label="Roles" name="role_ids" model={model} setValue={setValue} apiUrl="/get-options" collection="Role" labelFields={['name']} valueFields={['_id']} multiple placeholder="Select Roles" value={watch('role_ids')} error={errors.role_ids?.[0]} />
          <CustomSelect<FormData> id="blood_group" label="Blood Group" name="blood_group" placeholder="Select Blood Group" options={bloodGroups} error={errors.blood_group} setValue={setValue} model={model} value={watch('blood_group')} defaultOption={{ label: 'None', value: '' }} />
        </div>

        <CustomSelect<FormData> id="permission_ids" label="Permissions" name="permission_ids" model={model} setValue={setValue} apiUrl="/get-options" collection="Permission" labelFields={['name']} valueFields={['_id']} multiple placeholder="Select Permissions" value={watch('permission_ids')} error={errors.permission_ids?.[0]} />

        <div className="flex flex-col md:flex-row gap-4">
          <DateTimeInput id="dob" label="Date of Birth" name="dob" value={watch('dob') ?? null} setValue={(field, value) => setValue(field as any, value)} error={errors.dob} placeholder="Select DOB" showTime={false} showResetButton={true} model={model} />
          <BasicInput id="nid" label="NID" placeholder="NID" register={register('nid')} error={errors.nid} model={model} />
        </div>

        <SingleImageInput label="Profile Picture" preview={preview} onDrop={onDrop} clearImage={clearImage} error={errors.image} isRequired={false} />

        <BasicTextarea id="address" label="Address" placeholder="Enter address" register={register('address')} error={errors.address} model={model} />
        <BasicTextarea id="description" label="Description" placeholder="Enter description" register={register('description')} error={errors.description} model={model} />

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>Reset</Button>
          <Button variant="warning" type="submit" className="" disabled={submitLoading}>
            {submitLoading ? 'Saving...' : 'Update User'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
