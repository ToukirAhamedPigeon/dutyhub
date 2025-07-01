'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel } from 'react-icons/fa'

/** --- RowActions Component --- **/
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
          <FaEye /> <span className="hidden md:block">Detail</span>
        </Button>
      )}
      {onEdit && (
        <Button size="sm" variant="warning" onClick={() => onEdit(row)}>
          <FaEdit /> <span className="hidden md:block">Edit</span>
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
          <FaTrash /> <span className="hidden md:block">Delete</span>
        </Button>
      )}
    </div>
  )
}

/** --- RecordInfo Component --- **/
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

/** --- IndexCell Component --- **/
interface IndexCellProps {
  rowIndex: number
  pageIndex: number
  pageSize: number
}

export function IndexCell({ rowIndex, pageIndex, pageSize }: IndexCellProps) {
  return <>{rowIndex + 1 + pageIndex * pageSize}</>
}

/** --- TableHeaderActions Component --- **/
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
  addButtonLabel = 'Add New',
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
          <Button variant="success" onClick={onAddNew}>
            <FaPlus /> <span className="hidden md:block">{addButtonLabel}</span>
          </Button>
        )}
        {onPrint && (
          <Button variant="info" onClick={onPrint}>
            <FaPrint /> <span className="hidden md:block">Print</span>
          </Button>
        )}
        {onExport && (
          <Button variant="success" onClick={onExport}>
            <FaFileExcel /> <span className="hidden md:block">Export Excel</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/** --- TablePaginationFooter Component --- **/
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
        <label htmlFor="pageSize" className="hidden md:block">
          Rows per page:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {[5, 10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Button size="sm" onClick={() => setPageIndex(Math.max(pageIndex - 1, 0))} disabled={pageIndex === 0}>
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

/** --- TableLoader Component --- **/
export function TableLoader({ loading }: { loading: boolean }) {
  return loading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
      <Image
        src="/loader.svg"
        alt="Loading…"
        className="h-12 w-12 animate-spin"
        width={120}
        height={120}
        style={{ background: 'transparent' }}
      />
    </div>
  ) : null
}

/** --- ColumnSettingsModal Component --- **/
type ColumnSettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (columns: any[]) => void
  visible: any[]
  hidden: any[]
  setVisible: (cols: any[]) => void
  setHidden: (cols: any[]) => void
  moveToHidden: (ids: string[]) => void
  moveToVisible: (ids: string[]) => void
  move: (ids: string[], dir: 'up' | 'down' | 'top' | 'bottom') => void
  reset: () => void
}

export function ColumnSettingsModal({
  isOpen,
  onClose,
  onSave,
  visible,
  hidden,
  setVisible,
  setHidden,
  moveToHidden,
  moveToVisible,
  move,
  reset,
}: ColumnSettingsModalProps) {
  const [selectedVisible, setSelectedVisible] = useState<string[]>([])
  const [selectedHidden, setSelectedHidden] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filteredHidden = hidden.filter((col) =>
    (col.header as string).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-bold mb-2">Display</h3>
            <ScrollArea className="border rounded h-64 p-2 space-y-1">
              {visible.map((col, index) => (
                <div
                  key={col.id ?? col.accessorKey ?? `visible-${index}`}
                  onDoubleClick={() => moveToHidden([col.id as string])}
                  onClick={() =>
                    setSelectedVisible((prev) =>
                      prev.includes(col.id as string)
                        ? prev.filter((i) => i !== col.id)
                        : [...prev, col.id as string],
                    )
                  }
                  className={`p-2 cursor-pointer rounded ${
                    selectedVisible.includes(col.id) ? 'bg-blue-200' : ''
                  }`}
                >
                  {col.header}
                </div>
              ))}
            </ScrollArea>
            <div className="flex flex-wrap gap-1 mt-2">
              <Button size="sm" onClick={() => move(selectedVisible, 'up')}>
                ⬆️ Up
              </Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'down')}>
                ⬇️ Down
              </Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'top')}>
                ⏫ Top
              </Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'bottom')}>
                ⏬ Bottom
              </Button>
              <Button size="sm" variant="destructive" onClick={() => moveToHidden(selectedVisible)}>
                Hide
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center items-center gap-2">
            <Button variant="outline" onClick={() => moveToHidden(visible.map((c) => c.id as string))}>
              ⇨ Hide All
            </Button>
            <Button variant="outline" onClick={() => moveToVisible(hidden.map((c) => c.id as string))}>
              ⇦ Show All
            </Button>
          </div>

          {/* Hidden Columns */}
          <div>
            <h3 className="font-bold mb-2">Do Not Display</h3>
            <Input
              placeholder="Search headers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="border rounded h-64 p-2 space-y-1">
              {filteredHidden.map((col, index) => (
                <div
                  key={col.id ?? col.accessorKey ?? `hidden-${index}`}
                  onDoubleClick={() => moveToVisible([col.id as string])}
                  onClick={() =>
                    setSelectedHidden((prev) =>
                      prev.includes(col.id as string)
                        ? prev.filter((i) => i !== col.id)
                        : [...prev, col.id as string],
                    )
                  }
                  className={`p-2 cursor-pointer rounded ${
                    selectedHidden.includes(col.id) ? 'bg-green-200' : ''
                  }`}
                >
                  {col.header}
                </div>
              ))}
            </ScrollArea>
            <Button size="sm" className="mt-2" onClick={() => moveToVisible(selectedHidden)}>
              Show Selected
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-end mt-4 gap-2">
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onSave(visible)
              onClose()
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
