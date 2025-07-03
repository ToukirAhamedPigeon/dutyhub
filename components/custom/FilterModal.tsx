'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FilterModalProps<T> {
  tableId: string
  open: boolean
  onClose: () => void
  onApply: (filterValues: T) => void
  initialFilters: T
  renderForm: (
    filterValues: T,
    setFilterValues: React.Dispatch<React.SetStateAction<T>>
  ) => React.ReactNode
}

export function FilterModal<T>({
  tableId,
  open,
  onClose,
  onApply,
  initialFilters,
  renderForm,
}: FilterModalProps<T>) {
  const [filterValues, setFilterValues] = useState<T>(initialFilters)

  const LOCAL_KEY = `filterModal:${tableId}`

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        try {
          setFilterValues(JSON.parse(saved))
        } catch {
          setFilterValues(initialFilters)
        }
      } else {
        setFilterValues(initialFilters)
      }
    } else {
      setFilterValues(initialFilters)
    }
  }, [open, initialFilters])

  

  const isFilterApplied = () =>
    JSON.stringify(filterValues) !== JSON.stringify(initialFilters)

  const handleApply = () => {
    onApply(filterValues)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filterValues))
    onClose()
  }

  const handleReset = () => {
    setFilterValues(initialFilters)
    localStorage.removeItem(LOCAL_KEY)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="min-w-[95%] max-h-[80%] sm:min-w-[60%] shadow-[0_0_10px_rgba(0,0,0,0.25)] sm:shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.25)] bg-gradient-to-br from-white via-gray-100 to-white"
      >
        <DialogHeader>
          <DialogTitle>Filter Users</DialogTitle>
        </DialogHeader>

        <div className="py-4 px-2 max-h-[400px] overflow-y-auto">{renderForm(filterValues, setFilterValues)}</div>

        <DialogFooter className="flex flex-row justify-center sm:justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply} disabled={!isFilterApplied()}>
            Apply Filters
          </Button>
          <Button variant="destructive" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
