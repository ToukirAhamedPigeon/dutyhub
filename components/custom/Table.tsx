'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel } from 'react-icons/fa'
import Image from 'next/image'

interface RowActionsProps<T> {
  row: T
  onDetail?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export function RowActions<T>({ row, onDetail, onEdit, onDelete }: RowActionsProps<T>) {
  return (
    <div className="flex gap-2">
      {onDetail && (
        <Button size="sm" variant="info" onClick={() => onDetail(row)}>
          <FaEye /> <span className='hidden md:block'>Detail</span>
        </Button>
      )}
      {onEdit && (
        <Button size="sm" variant="warning" onClick={() => onEdit(row)}>
          <FaEdit /> <span className='hidden md:block'>Edit</span>
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
          <FaTrash /> <span className='hidden md:block'>Delete</span>
        </Button>
      )}
    </div>
  )
}

interface RecordInfoProps {
  pageIndex: number
  pageSize: number
  totalCount: number
}

export function RecordInfo({ pageIndex, pageSize, totalCount }: RecordInfoProps) {
  return (
    <span>
      Showing {pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, totalCount)} of {totalCount}
    </span>
  )
}

interface IndexCellProps {
  rowIndex: number
  pageIndex: number
  pageSize: number
}

export function IndexCell({ rowIndex, pageIndex, pageSize }: IndexCellProps) {
  return <>{rowIndex + 1 + pageIndex * pageSize}</>
}

interface TableHeaderActionsProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onAddNew?: () => void
  onPrint?: () => void
  onExport?: () => void
  addButtonLabel?: string
}

export function TableHeaderActions({
  searchValue,
  onSearchChange,
  onAddNew,
  onPrint,
  onExport,
  addButtonLabel = 'Add New'
}: TableHeaderActionsProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <Input
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-[150px] md:w-1/3"
      />
      <div className="flex gap-2">
        {onAddNew && (
          <Button variant="success" onClick={onAddNew}><FaPlus /> <span className='hidden md:block'>{addButtonLabel}</span></Button>
        )}
        {onPrint && (
          <Button variant="info" onClick={onPrint}><FaPrint /> <span className='hidden md:block'>Print</span></Button>
        )}
        {onExport && (
          <Button variant="success" onClick={onExport}><FaFileExcel /> <span className='hidden md:block'>Export Excel</span></Button>
        )}
      </div>
    </div>
  )
}



interface TablePaginationFooterProps {
  pageIndex: number
  pageSize: number
  totalCount: number
  setPageIndex: (value: number) => void
  setPageSize: (value: number) => void
}

export function TablePaginationFooter({
    pageIndex,
    pageSize,
    totalCount,
    setPageIndex,
    setPageSize,
  }: TablePaginationFooterProps) {
    const totalPage = Math.ceil(totalCount / pageSize)
  
    return (
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm gap-2">
        <RecordInfo pageIndex={pageIndex} pageSize={pageSize} totalCount={totalCount} />
  
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="hidden md:block">Rows per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
  
          <Button
            size="sm"
            onClick={() => setPageIndex(Math.max(pageIndex - 1, 0))}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
  
          <Button
            size="sm"
            onClick={() => setPageIndex(Math.min(pageIndex + 1, totalPage - 1))}
            disabled={(pageIndex + 1) * pageSize >= totalCount}
          >
            Next
          </Button>
        </div>
      </div>
    )
}

export function TableLoader({ loading }: { loading: boolean }) {
  return loading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
      <Image
        src="/loader.svg"
        alt="Loading…"
        className="h-12 w-12 animate-spin"
        width={120} height={120}
        style={{ background: "transparent" }}
      />
    </div>
  ) : null;
}
  