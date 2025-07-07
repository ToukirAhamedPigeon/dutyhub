'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'
import { bloodGroups } from '@/constants'

export interface UserFilters {
  name?: string
  email?: string
  username?: string
  phone?: string
  bp_no?: string
  nid?: string
  current_status?: string
  role_ids?: string[]
  blood_group?: string[]
}

interface UserFilterFormProps {
  filterValues: UserFilters
  setFilterValues: React.Dispatch<React.SetStateAction<UserFilters>>
  onClose: () => void
}

const LOCAL_STORAGE_KEY = 'userFilters'

export function UserFilterForm({
  filterValues,
  setFilterValues,
}: UserFilterFormProps) {
  const initialized = useRef(false)

  const {
    register,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFilters>({
    defaultValues: filterValues,
  })

  const model = 'User'

  // Load from localStorage on first mount and merge with filterValues
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const savedValues = JSON.parse(saved) as UserFilters
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
      const cleanedValues: UserFilters = {
        ...values,
        role_ids: values.role_ids?.filter((id): id is string => typeof id === 'string'),
        blood_group: values.blood_group?.filter((id): id is string => typeof id === 'string'),
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
        <BasicInput
          id="username"
          label="Username"
          isRequired={false}
          placeholder="Username"
          register={register('username')}
          model={model}
        />
        <BasicInput
          id="email"
          label="Email"
          isRequired={false}
          placeholder="Email"
          register={register('email')}
          model={model}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <BasicInput
          id="phone"
          label="Phone"
          isRequired={false}
          placeholder="Phone"
          register={register('phone')}
          model={model}
        />
        <BasicInput
          id="bp_no"
          label="BP No"
          isRequired={false}
          placeholder="BP No"
          register={register('bp_no')}
          model={model}
        />
        <BasicInput
          id="nid"
          label="NID"
          isRequired={false}
          placeholder="NID"
          register={register('nid')}
          model={model}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<UserFilters>
          id="current_status"
          label="Current Status"
          name="current_status"
          placeholder="Select Current Status"
          isRequired={false}
          options={[
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' },
          ]}
          defaultOption={{ label: 'All', value: '' }}
          error={errors.current_status}
          setValue={setValue}
          value={watch('current_status')}
          model={model}
        />

        <CustomSelect<UserFilters>
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

        <CustomSelect<UserFilters>
          id="blood_group"
          label="Blood Group"
          name="blood_group"
          placeholder="Select Blood Group"
          isRequired={false}
          options={bloodGroups}
          error={errors.blood_group?.[0]}
          setValue={setValue}
          model={model}
          value={watch('blood_group')}
          multiple={true}
        />
      </div>
    </form>
  )
}
