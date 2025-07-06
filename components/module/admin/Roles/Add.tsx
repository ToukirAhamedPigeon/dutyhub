'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { checkValueExists } from '@/lib/validations'
import { accessToken } from '@/lib/tokens';
import {CustomSelect, UniqueInput} from '@/components/custom/FormInputs'
import { useTranslations } from 'next-intl';
import { guards } from '@/constants'

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  guard_name: z.string().min(1, 'Guard Name is required'),
  permission_ids: z
  .array(
    z.string().regex(objectIdRegex, {
      message: "Each permission ID must be a valid ObjectId",
    })
  )
});

type FormData = z.infer<typeof schema>

interface AddProps {
  fetchData: () => Promise<void>;
}


export default function Add({fetchData}:AddProps) {
  const t = useTranslations();
  const token = accessToken()
  const [submitLoading, setSubmitLoading] = useState(false)
  const model='Role'

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
      guard_name: '',
      permission_ids: []
    }
  })

  // Form Submit
  const onSubmit = async (data: FormData) => {
    setSubmitLoading(true);
  
    try {
      // Check if name is already taken
      const nameTaken = await checkValueExists("Role", "name", data.name);
      if (nameTaken) {
        setError("name", { type: "manual", message: "Name already exists" });
        setSubmitLoading(false);
        return;
      }
  
      // Prepare data for submission
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("guard_name", data.guard_name);
      formData.append("permission_ids", JSON.stringify(data.permission_ids));
  
      const res = await api.post("/roles/add", formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
  
      const result = res.data;
  
      if (!result.success) {
        throw new Error(result.message || "Failed to add role");
      }
  
      toast.success(t("Role added successfully!"), {
        style: {
          background: 'green',
          color: 'white',
        },
      });
      reset(); // Reset form values
      await fetchData();
  
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong during adding role");
    } finally {
      setSubmitLoading(false);
    }
  };
  

  // Reset Handler
  const handleReset = () => {
    reset()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
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
              isRequired={true}
              register={register('name')}
              error={errors.name}
              uniqueErrorMessage="Name already exists"
              field="name"
              watchValue={watch('name')}
            />
          </div>
          <div className="md:w-1/4 w-full">
            <CustomSelect<FormData>
                id="guard_name"
                label="Guard Name"
                name="guard_name"
                placeholder="Select Guard Name"
                isRequired={true}
                options={guards}
                error={errors.guard_name}
                setValue={setValue}
                value={watch("guard_name")}
                model={model}
              />
        </div>
      </div>

        <CustomSelect<FormData>
            id="permission_ids"
            label="Permissions"
            name="permission_ids"
            setValue={setValue}
            model="Role"
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

        {/* Submit Actions */}
        <div className="flex justify-between gap-4 mt-4 border-t border-gray-300 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} disabled={submitLoading}>
            {t('Reset Form')}
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={submitLoading}>
            {submitLoading ? t('Adding')+'...' : t('Add Role')}
          </Button>
        </div>
        </form>

    </motion.div>
  )
}
