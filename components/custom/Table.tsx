'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ColumnDef } from '@tanstack/react-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel, FaSlidersH } from 'react-icons/fa'
import { ArrowBigDown, ArrowBigLeft, ArrowBigRight, ArrowBigUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'

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
  onColumnSettings?: () => void
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
  onColumnSettings,
  addButtonLabel = 'Add New',
}: TableHeaderActionsProps & {
  onColumnSettings?: () => void;
}) {
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
        {onColumnSettings && (
          <Button variant="info" onClick={onColumnSettings}>
            <FaSlidersH /> <span className="hidden md:block">Columns</span>
          </Button>
        )}
        {onPrint && (
          <Button variant="info" onClick={onPrint} className='bg-gray-800'>
            <FaPrint /> <span className="hidden md:block">Print</span>
          </Button>
        )}
        {onExport && (
          <Button variant="success" onClick={onExport} className='bg-green-800'>
            <FaFileExcel /> <span className="hidden md:block">Excel</span>
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

// export type ColumnKey = string

// export type ColumnSettingsModalProps<T> = {
//   isOpen: boolean
//   onClose: () => void
//   onSave: (columns: ColumnDef<T>[]) => void
//   visible: ColumnDef<T>[]
//   hidden: ColumnDef<T>[]
//   setVisible: (cols: ColumnDef<T>[]) => void
//   setHidden: (cols: ColumnDef<T>[]) => void
//   moveToHidden: (ids: string[]) => void
//   moveToVisible: (ids: string[]) => void
//   move: (ids: string[], dir: 'up' | 'down' | 'top' | 'bottom') => void
//   reset: () => void
// }

// export function ColumnSettingsModal<T>({
//   isOpen,
//   onClose,
//   onSave,
//   visible,
//   hidden,
//   setVisible,
//   setHidden,
//   moveToHidden,
//   moveToVisible,
//   move,
//   reset,
// }: ColumnSettingsModalProps<T>) {
//   const [selectedVisible, setSelectedVisible] = useState<string[]>([])
//   const [selectedHidden, setSelectedHidden] = useState<string[]>([])
//   const [search, setSearch] = useState('')

//   const getId = (col: ColumnDef<T>, index: number, prefix: string) =>
//     (col.id ?? `${prefix}-${index}`) as string

//   const handleSelect = (
//     id: string,
//     selected: string[],
//     setSelected: (s: string[]) => void,
//     e: React.MouseEvent
//   ) => {
//     if (e.metaKey || e.ctrlKey) {
//       setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id])
//     } else {
//       setSelected([id])
//     }
//   }

//   const filteredHidden = hidden.filter((col) =>
//     (String(col.header) || '').toLowerCase().includes(search.toLowerCase())
//   )

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl min-h-[95vh] overflow-auto">
//         <DialogHeader>
//           <DialogTitle>Column Settings</DialogTitle>
//         </DialogHeader>

//         <div className="grid grid-cols-[42%_8%_42%] gap-4">
//           {/* Visible Columns */}
//           <div>
//             <h3 className="font-bold mb-2">Display</h3>
//             <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
//               {visible.map((col, index) => {
//                 const colId = getId(col, index, 'visible')
//                 return (
//                   <div key={colId} className="border-b border-gray-300">
//                     <div
//                       onDoubleClick={() => moveToHidden([colId])}
//                       onClick={(e) =>
//                         handleSelect(colId, selectedVisible, setSelectedVisible, e)
//                       }
//                       className={`w-full py-1 px-2 cursor-pointer ${
//                         selectedVisible.includes(colId) ? 'bg-blue-200' : ''
//                       }`}
//                     >
//                       {String(col.header)}
//                     </div>
//                   </div>
//                 )
//               })}
//             </ScrollArea>

//             <div className="flex flex-wrap gap-1 mt-2 items-center justify-center">
//               <Button title="Move Up" size="xs" onClick={() => move(selectedVisible, 'up')}>
//                 <ArrowUp />
//               </Button>
//               <Button title="Move Down" size="xs" onClick={() => move(selectedVisible, 'down')}>
//                 <ArrowDown />
//               </Button>
//               <Button title="Move to Top" size="xs" onClick={() => move(selectedVisible, 'top')}>
//                 <ArrowBigUp />
//               </Button>
//               <Button title="Move to Bottom" size="xs" onClick={() => move(selectedVisible, 'bottom')}>
//                 <ArrowBigDown />
//               </Button>
//             </div>
//           </div>

//           {/* Controls */}
//           <div className="flex flex-col justify-center items-center gap-2">
//             <Button title="Move to Do not Display" size="xs" onClick={() => moveToHidden(selectedVisible)}>
//               <ArrowRight />
//             </Button>
//             <Button title="Move to Display" size="xs" onClick={() => moveToVisible(selectedHidden)}>
//               <ArrowLeft />
//             </Button>
//             <Button
//               title="Hide All"
//               size="xs"
//               onClick={() => moveToHidden(visible.map((c, i) => getId(c, i, 'visible')))}
//             >
//               <ArrowBigLeft />
//             </Button>
//             <Button
//               title="Show All"
//               size="xs"
//               onClick={() => moveToVisible(hidden.map((c, i) => getId(c, i, 'hidden')))}
//             >
//               <ArrowBigRight />
//             </Button>
//           </div>

//           {/* Hidden Columns */}
//           <div>
//             <h3 className="font-bold mb-2">Do Not Display</h3>
//             <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
//               {filteredHidden.map((col, index) => {
//                 const colId = getId(col, index, 'hidden')
//                 return (
//                   <div key={colId} className="border-b border-gray-300">
//                     <div
//                       onDoubleClick={() => moveToVisible([colId])}
//                       onClick={(e) =>
//                         handleSelect(colId, selectedHidden, setSelectedHidden, e)
//                       }
//                       className={`px-2 py-1 cursor-pointer rounded ${
//                         selectedHidden.includes(colId) ? 'bg-green-200' : ''
//                       }`}
//                     >
//                       {String(col.header)}
//                     </div>
//                   </div>
//                 )
//               })}
//             </ScrollArea>
//             <Input
//               placeholder="Search"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="mt-2"
//             />
//           </div>
//         </div>

//         <DialogFooter className="flex justify-end mt-4 gap-2">
//           <Button variant="secondary" onClick={reset}>Reset</Button>
//           <Button variant="outline" onClick={onClose}>Close</Button>
//           <Button onClick={() => { onSave(visible); onClose() }}>Save</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

