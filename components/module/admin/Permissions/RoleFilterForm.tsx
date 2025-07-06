'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { guards } from '@/constants'

export interface RoleFilters {
  name?: string
  guard_name?: string
  permission_ids?: string[]
}

interface RoleFilterFormProps {
  filterValues: RoleFilters
  setFilterValues: React.Dispatch<React.SetStateAction<RoleFilters>>
  onClose: () => void
}

const LOCAL_STORAGE_KEY = 'roleFilters'

export function RoleFilterForm({
  filterValues,
  setFilterValues,
}: RoleFilterFormProps) {
  const initialized = useRef(false)

  const {
    register,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleFilters>({
    defaultValues: filterValues,
  })

  const model = 'Role'

  // Load from localStorage on first mount and merge with filterValues
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const savedValues = JSON.parse(saved) as RoleFilters
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
      const cleanedValues: RoleFilters = {
        ...values,
        permission_ids: values.permission_ids?.filter((id): id is string => typeof id === 'string'),
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
        <CustomSelect<RoleFilters>
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
        <CustomSelect<RoleFilters>
          id="permission_ids"
          label="Permissions"
          name="permission_ids"
          setValue={setValue}
          model={model}
          apiUrl="/get-options"
          collection="Permission"
          labelFields={['name']}
          valueFields={['_id']}
          sortOrder="asc"
          isRequired={false}
          placeholder="Select Permissions"
          multiple={true}
          value={watch('permission_ids')}
          error={errors.permission_ids?.[0]}
        />
      </div>
    </form>
  )
}
