'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import {  accessToken } from '@/lib/tokens'

import {
  CustomSelect,
  UniqueInput,
} from '@/components/custom/FormInputs'
import { guards } from '@/constants'
import { useTranslations } from 'next-intl'
import { useAppDispatch } from '@/hooks/useRedux';
import { initAuthUser } from '@/lib/initAuthUser';

const objectIdRegex = /^[0-9a-fA-F]{24}$/

const schema = z.object({
  _id: z.string().regex(objectIdRegex, 'Invalid role ID'),
  name: z.string().min(1, 'Name is required'),
  guard_name: z.string().min(1, 'Guard Name is required'),
  permission_ids: z
    .array(z.string().regex(objectIdRegex, { message: 'Invalid permission ID' }))
    .optional(),
})

type FormData = z.infer<typeof schema>

interface EditRoleProps {
  role: any
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditRole({ role, fetchData, onClose }: EditRoleProps) {
  const t = useTranslations();
  const token =  accessToken()
  const [submitLoading, setSubmitLoading] = useState(false)
  const model = 'Role'
  const dispatch = useAppDispatch();

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
      ...role,
    },
  })

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('guard_name', data.guard_name)
      formData.append('permission_ids', JSON.stringify(data.permission_ids || []))

      const res = await api.patch(`/roles/${data._id}`, formData, {headers: {
        Authorization: `Bearer ${token}`
      },})

      if (!res.data.success) throw new Error(res.data.message || 'Update failed')
      
      await initAuthUser(dispatch, true);

      toast.success(t('Role updated successfully!'), {
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
          <div className="md:w-3/4 w-full">
            <UniqueInput
              id="name"
              label="Name"
              placeholder="Name"
              model={model}
              isRequired
              register={register('name')}
              error={errors.name}
              field="name"
              watchValue={watch('name')}
              uniqueErrorMessage="Name already exists"
              exceptFieldValue={role._id}
              exceptFieldName="_id"
            />
          </div>
          <div className="md:w-1/4 w-full">
            <CustomSelect<FormData> id="guard_name" label="Guard Name" name="guard_name" placeholder="Select Guard Name" isRequired options={guards} error={errors.guard_name} setValue={setValue} value={watch('guard_name')} model={model} />
          </div>
        </div>
        <CustomSelect<FormData> id="permission_ids" label="Permissions" name="permission_ids" model={model} setValue={setValue} apiUrl="/get-options" collection="Permission" labelFields={['name']} valueFields={['_id']} multiple placeholder="Select Permissions" value={watch('permission_ids')?.map((v: any) => typeof v === 'object' ? v.value : v)} error={errors.permission_ids?.[0]} />

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>{t('Reset')}</Button>
          <Button variant="warning" type="submit" className="" disabled={submitLoading}>
            {submitLoading ? t('Saving')+'...' : t('Update Role')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
