'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { accessToken } from '@/lib/tokens'
import { BasicInput, BasicTextarea, CustomSelect } from '@/components/custom/FormInputs'
import { useTranslations } from 'next-intl'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

const schema = z.object({
  _id: z.string().regex(objectIdRegex, 'Invalid ID'),
  name: z.string().min(1, 'Name is required'),
  bn_name: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.string().regex(objectIdRegex, { message: 'Invalid parent ID' }).optional().or(z.literal('')),
  alt_parent_id: z.string().regex(objectIdRegex, { message: 'Invalid alternate parent ID' }).optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface EditLookupProps {
  lookup: any
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function EditLookup({ lookup, fetchData, onClose }: EditLookupProps) {
  const t = useTranslations()
  const token = accessToken()
  const [submitLoading, setSubmitLoading] = useState(false)
  const model = 'Lookup'

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...lookup,
      parent_id: lookup.parent_id?._id || '',
      alt_parent_id: lookup.alt_parent_id?._id || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name.trim())
      formData.append('bn_name', data.bn_name?.trim() || '')
      formData.append('description', data.description || '')
      if (data.parent_id) formData.append('parent_id', data.parent_id)
      if (data.alt_parent_id) formData.append('alt_parent_id', data.alt_parent_id)

      const res = await api.patch(`/lookups/${data._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.data.success) throw new Error(res.data.message || 'Update failed')

      toast.success(t('Lookup updated successfully!'))
      await fetchData()
      onClose()
    } catch (err: any) {
      console.error('Lookup update error:', err)
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleReset = () => reset()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 w-full space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2 w-full">
            <BasicInput
              id="name"
              label="Name"
              placeholder="Name"
              register={register('name')}
              error={errors.name}
              model={model}
              isRequired
            />
          </div>

          <div className="md:w-1/2 w-full">
            <BasicInput
              id="bn_name"
              label="Bangla Name"
              placeholder="Bangla Name"
              register={register('bn_name')}
              error={errors.bn_name}
              model={model}
            />
          </div>
        </div>

        <BasicTextarea
          id="description"
          label="Description"
          placeholder="Enter description"
          register={register('description')}
          error={errors.description}
          model={model}
        />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2 w-full">
            <CustomSelect<FormData>
              id="parent_id"
              label="Parent Lookup"
              name="parent_id"
              setValue={setValue}
              model={model}
              apiUrl="/get-options"
              collection="Lookup"
              labelFields={['name']}
              valueFields={['_id']}
              sortOrder="asc"
              isRequired={false}
              placeholder="Select Parent"
              value={watch('parent_id')}
              error={errors.parent_id}
              filter={{ parent_id: { $in: [null, ''] } }}
            />
          </div>

          <div className="md:w-1/2 w-full">
            <CustomSelect<FormData>
              id="alt_parent_id"
              label="Alternate Parent Lookup"
              name="alt_parent_id"
              setValue={setValue}
              model={model}
              apiUrl="/get-options"
              collection="Lookup"
              labelFields={['name']}
              valueFields={['_id']}
              sortOrder="asc"
              isRequired={false}
              placeholder="Select Alternate Parent"
              value={watch('alt_parent_id')}
              error={errors.alt_parent_id}
            />
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset')}
          </Button>
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitLoading}>
            {submitLoading ? t('Saving') + '...' : t('Update Lookup')}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
