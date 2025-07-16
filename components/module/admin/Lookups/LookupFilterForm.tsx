'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { BasicInput, CustomSelect } from '@/components/custom/FormInputs'

export interface LookupFilters {
  name?: string
  bn_name?: string
  parent_id?: string[]
  alt_parent_id?: string[]
}

interface LookupFilterFormProps {
  filterValues: LookupFilters
  setFilterValues: React.Dispatch<React.SetStateAction<LookupFilters>>
  onClose: () => void
}

const LOCAL_STORAGE_KEY = 'lookupFilters'

export function LookupFilterForm({
  filterValues,
  setFilterValues,
}: LookupFilterFormProps) {
  const initialized = useRef(false)

  const {
    register,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LookupFilters>({
    defaultValues: filterValues,
  })

  const model = 'Lookup'

  // Load saved filters from localStorage
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const savedValues = JSON.parse(saved)

        // Defensive check: ensure arrays are arrays
        const normalized: LookupFilters = {
          ...filterValues,
          ...savedValues,
          parent_id: Array.isArray(savedValues.parent_id) ? savedValues.parent_id : [],
          alt_parent_id: Array.isArray(savedValues.alt_parent_id) ? savedValues.alt_parent_id : [],
        }

        reset(normalized)
        setFilterValues(normalized)
      } else {
        reset(filterValues)
      }
    } catch (err) {
      console.error('Failed to load lookup filters from localStorage:', err)
    }
  }, [filterValues, reset, setFilterValues])

  // Sync form values with parent and localStorage
  useEffect(() => {
    const subscription = watch((values) => {
      const cleanedValues: LookupFilters = {
      ...values,
      parent_id: (values.parent_id || []).filter((v): v is string => typeof v === 'string'),
      alt_parent_id: (values.alt_parent_id || []).filter((v): v is string => typeof v === 'string'),
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
          placeholder="Enter English Name"
          register={register('name')}
          model={model}
        />
        <BasicInput
          id="bn_name"
          label="Bangla Name"
          isRequired={false}
          placeholder="Enter Bangla Name"
          register={register('bn_name')}
          model={model}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<LookupFilters>
          id="parent_id"
          label="Parent"
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
          multiple={true}
          value={watch('parent_id') || []}
          error={Array.isArray(errors.parent_id) ? errors.parent_id[0] : errors.parent_id}
          filter={{
            $or: [
              { parent_id: { $exists: false } },
              { parent_id: null },
            ],
          }}
        />


        <CustomSelect<LookupFilters>
          id="alt_parent_id"
          label="Alt Parent"
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
          multiple={true}
          value={watch('alt_parent_id') || []}
          error={Array.isArray(errors.alt_parent_id) ? errors.alt_parent_id[0] : errors.alt_parent_id}
        />
      </div>
    </form>
  )
}
