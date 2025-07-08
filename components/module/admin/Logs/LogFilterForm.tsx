'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs'
import { actionOptions, collectionOptions } from '@/constants'
import { can } from '@/lib/authcheck/client'
import { useAppSelector } from '@/hooks/useRedux'

const LOCAL_STORAGE_KEY = 'logFilters'

export interface LogFilters {
  collectionName?: string[]
  actionType?: string[]
  createdBy: string[]
  createdAtFrom?: Date | null
  createdAtTo?: Date | null
}

interface LogFilterFormProps {
  filterValues: LogFilters
  setFilterValues: React.Dispatch<React.SetStateAction<LogFilters>>
  onClose: () => void
}

export function LogFilterForm({
  filterValues,
  setFilterValues,
}: LogFilterFormProps) {
  const hasReadAllPermission = can(['read-all-logs'])
  const initialized = useRef(false)
  const model = 'Log'
  const user = useAppSelector((state) => state.authUser)

  const {
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LogFilters>({
    defaultValues: {
      ...filterValues,
      createdAtFrom: filterValues.createdAtFrom ?? new Date(),
      createdAtTo: filterValues.createdAtTo ?? new Date(),
      createdBy: hasReadAllPermission
        ? filterValues.createdBy
        : [user.object_id ?? ''], // fallback to auth user ID
    },
  })

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const savedValues = JSON.parse(saved) as LogFilters
        const merged: LogFilters = {
          ...filterValues,
          ...savedValues,
          createdAtFrom: savedValues.createdAtFrom
            ? new Date(savedValues.createdAtFrom)
            : new Date(),
          createdAtTo: savedValues.createdAtTo
            ? new Date(savedValues.createdAtTo)
            : new Date(),
          createdBy: hasReadAllPermission
            ? savedValues.createdBy
            : [user.object_id ?? ''],
        }
        reset(merged)
        setFilterValues(merged)
      } else {
        reset()
      }
    } catch (err) {
      console.error('Failed to load filter values from localStorage:', err)
    }
  }, [filterValues, reset, setFilterValues, user, hasReadAllPermission])

  useEffect(() => {
    const subscription = watch((values) => {
      const cleaned: LogFilters = {
        ...values,
        collectionName: values.collectionName?.filter((v): v is string => typeof v === 'string'),
        actionType: values.actionType?.filter((v): v is string => typeof v === 'string'),
        createdBy: (values.createdBy ?? []).filter((v): v is string => typeof v === 'string'),
      }

      setFilterValues((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(cleaned)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned))
          return cleaned
        }
        return prev
      })
    })

    return () => subscription.unsubscribe()
  }, [watch, setFilterValues])

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {/* Collection Name & Action Type */}
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<LogFilters>
          id="collectionName"
          label="Collection Name"
          name="collectionName"
          placeholder="Select Collection"
          isRequired={false}
          options={collectionOptions}
          error={errors.collectionName?.[0]}
          setValue={setValue}
          model={model}
          value={watch('collectionName')}
          multiple={true}
        />

        <CustomSelect<LogFilters>
          id="actionType"
          label="Action Type"
          name="actionType"
          placeholder="Select Action"
          isRequired={false}
          options={actionOptions}
          error={errors.actionType?.[0]}
          setValue={setValue}
          model={model}
          value={watch('actionType')}
          multiple={true}
        />
      </div>

      {/* Created By - only if permission allows */}
      {hasReadAllPermission && (
        <div>
          <CustomSelect<LogFilters>
            id="createdBy"
            label="Created By"
            name="createdBy"
            setValue={setValue}
            model="User"
            apiUrl="/get-options"
            collection="User"
            labelFields={['name']}
            valueFields={['_id']}
            sortOrder="asc"
            isRequired={false}
            placeholder="Select User(s)"
            multiple={true}
            value={watch('createdBy')}
            error={errors.createdBy?.[0]}
          />
        </div>
      )}

      {/* Date From & To */}
      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="createdAtFrom"
          label="From Date"
          name="createdAtFrom"
          value={watch('createdAtFrom') ?? new Date()}
          setValue={(field: string, value: Date | null) =>
            setValue(field as keyof LogFilters, value)
          }
          error={errors.createdAtFrom}
          placeholder="Select start date"
          showTime={false}
          showResetButton={true}
          model={model}
        />

        <DateTimeInput
          id="createdAtTo"
          label="To Date"
          name="createdAtTo"
          value={watch('createdAtTo') ?? new Date()}
          setValue={(field: string, value: Date | null) =>
            setValue(field as keyof LogFilters, value)
          }
          error={errors.createdAtTo}
          placeholder="Select end date"
          showTime={false}
          showResetButton={true}
          model={model}
        />
      </div>
    </form>
  )
}
