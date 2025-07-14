'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { accessToken } from '@/lib/tokens';
import { CustomSelect, BasicInput, BasicTextarea } from '@/components/custom/FormInputs';
import { useTranslations } from 'next-intl';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bn_name: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.string().regex(objectIdRegex, { message: 'Invalid parent ID' }).optional().or(z.literal('')),
  alt_parent_id: z.string().regex(objectIdRegex, { message: 'Invalid alternate parent ID' }).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface AddLookupProps {
  fetchData: () => Promise<void>;
}

export default function AddLookup({ fetchData }: AddLookupProps) {
  const t = useTranslations();
  const token = accessToken();
  const [submitLoading, setSubmitLoading] = useState(false);
  const model = 'Lookup';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      bn_name: '',
      description: '',
      parent_id: '',
      alt_parent_id: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('bn_name', data.bn_name?.trim() || '');
      formData.append('description', data.description || '');
      if (data.parent_id) formData.append('parent_id', data.parent_id);
      if (data.alt_parent_id) formData.append('alt_parent_id', data.alt_parent_id);

      const res = await api.post('/lookups/add', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = res.data;
      if (!result.success) throw new Error(result.message || 'Failed to add lookup');

      toast.success(result.message || t('Lookup(s) added successfully!'));
      reset();
      await fetchData();
    } catch (err: any) {
      console.error('Add lookup error:', err);
      toast.error(err.message || 'Something went wrong during lookup creation');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => reset();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 w-full space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2 w-full">
            <BasicInput
              id="name"
              label="Name(s)"
              placeholder="e.g. Color=Size"
              register={register('name')}
              error={errors.name}
              model={model}
              isRequired
            />
          </div>

          <div className="md:w-1/2 w-full">
            <BasicInput
              id="bn_name"
              label="Bangla Name(s)"
              placeholder="Bangla Name(s)"
              register={register('bn_name')}
              error={errors.bn_name}
              model={model}
            />
          </div>
        </div>

        <BasicTextarea
          id="description"
          label="Description"
          placeholder="Enter a description"
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
              placeholder="Select Alt Parent"
              value={watch('alt_parent_id')}
              error={errors.alt_parent_id}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitLoading}>
            {submitLoading ? t('Adding') + '...' : t('Add Lookup')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
