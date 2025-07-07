'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { guards } from '@/constants'

export interface PermissionFilters {
  name?: string
  guard_name?: string
  role_ids?: string[]
}

interface PermissionFilterFormProps {
  filterValues: PermissionFilters
  setFilterValues: React.Dispatch<React.SetStateAction<PermissionFilters>>
  onClose: () => void
}

const LOCAL_STORAGE_KEY = 'permissionFilters'

export function PermissionFilterForm({
  filterValues,
  setFilterValues,
}: PermissionFilterFormProps) {
  const initialized = useRef(false)

  const {
    register,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PermissionFilters>({
    defaultValues: filterValues,
  })

  const model = 'Permission'

  // Load from localStorage on first mount and merge with filterValues
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const savedValues = JSON.parse(saved) as PermissionFilters
        const merged = { ...filterValues, ...savedValues }
        reset(merged)
        setFilterValues(merged)
      } else {
        reset(filterValues)
      }
    } catch (err) {
      console.error('Failed to load filter values from localStorage:', err)
    }
  }, [filterValues, reset, setFilterValues])

  // Sync form values with parent state and save to localStorage
  useEffect(() => {
    const subscription = watch((values) => {
      const cleanedValues: PermissionFilters = {
        ...values,
        role_ids: values.role_ids?.filter((id): id is string => typeof id === 'string'),
      }

      setFilterValues((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(cleanedValues)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanedValues))
          return cleanedValues
        }
        return prev
      })
    })

    return () => subscription.unsubscribe()
  }, [watch, setFilterValues])

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col md:flex-row gap-4">
        <BasicInput
          id="name"
          label="Name"
          isRequired={false}
          placeholder="Name"
          register={register('name')}
          model={model}
        />
        <CustomSelect<PermissionFilters>
          id="guard_name"
          label="Guard Name"
          name="guard_name"
          placeholder="Select Guard Name"
          isRequired={false}
          options={guards}
          defaultOption={{ label: 'All', value: '' }}
          error={errors.guard_name}
          setValue={setValue}
          value={watch('guard_name')}
          model={model}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<PermissionFilters>
          id="role_ids"
          label="Roles"
          name="role_ids"
          setValue={setValue}
          model={model}
          apiUrl="/get-options"
          collection="Role"
          labelFields={['name']}
          valueFields={['_id']}
          sortOrder="asc"
          isRequired={false}
          placeholder="Select Roles"
          multiple={true}
          value={watch('role_ids')}
          error={errors.role_ids?.[0]}
        />
      </div>
    </form>
  )
}
