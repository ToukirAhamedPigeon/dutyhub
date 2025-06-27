// components/DateTimePicker.tsx
'use client'

import { cn } from '@/lib/utils'
import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  selectedDate: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  className?: string
}

export default function DateTimePicker({ selectedDate, onChange, placeholder, className }: Props) {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText={placeholder || "Select date & time"}
      className={cn("w-full border border-gray-300 rounded px-3 py-2 bg-slate-50 focus:bg-slate-100", className)}
      wrapperClassName="w-full"
    />
  )
}
