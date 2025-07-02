'use client'

import React, { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  OnChangeFn,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'

import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import { useAppSelector } from '@/hooks/useRedux'

import Modal from '@/components/custom/Modal'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import Fancybox from '@/components/custom/FancyBox'
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell
} from '@/components/custom/Table'

import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatDateTimeDisplay, getAge } from '@/lib/formatDate'
import { capitalize, exportExcel } from '@/lib/helpers'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'

import Register from './Register'
import UserDetail from './UserDetail'
import { IUser } from '@/types'

// Import the new ColumnVisibilityManager
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'

// 🧱 Column Definitions
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  authroles,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (id: string) => void
  authroles: string[]
}): ColumnDef<IUser>[] => [
  {
    header: 'SL',
    id:'sl',
    cell: ({ row }) => (
      <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />
    ),
    meta: { customClassName: 'text-center' },
  },
  {
    header: 'Action',
    id:'action',
    cell: ({ row }) => (
      <RowActions
        row={row.original}
        onDetail={() => fetchDetail(row.original._id.toString())}
      />
    ),
  },
  { header: 'Name', id:'name', accessorKey: 'name' },
  { header: 'Username', id:'username', accessorKey: 'username' },
  { header: 'BP No', id:'bp_no', accessorKey: 'bp_no' },
  { header: 'Phone 1', id:'phone_1', accessorKey: 'phone_1' },
  { header: 'Email', id:'email', accessorKey: 'email' },
  { header: 'Address', id:'address', accessorKey: 'address' },
  ...(authroles.includes('developer')
    ? [{ header: 'Decrypted Password', id:'decrypted_password', accessorKey: 'decrypted_password' }]
    : []),
  {
    header: 'Profile Picture',
    id:'profile_picture',
    cell: ({ row }) => (
      <Fancybox
        src={row.original.image || '/policeman.png'}
        alt={row.original.name || 'Profile Picture'}
        className="w-14 h-14 rounded-full"
      />
    ),
  },
  {
    header: 'Roles',
    id:'roles',
    accessorKey: 'roleNames',
    cell: ({ getValue }) => capitalize(getValue() as string),
  },
  { header: 'Blood Group', id:'blood_group', accessorKey: 'blood_group' },
  { header: 'NID', id:'nid', accessorKey: 'nid' },
  {
    header: 'Date of Birth',
    accessorKey: 'dob',
    id:'dob',
    cell: ({ getValue }) =>
      getValue()
        ? `${formatDateTimeDisplay(getValue() as string, false)} Age: ${getAge(
            getValue() as string
          )}`
        : '-',
    meta: {
      customClassName: 'text-center min-w-[300px] whitespace-nowrap',
    },
  },
  {
    header: 'Current Status',
    accessorKey: 'current_status',
    id:'current_status',
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? 'success' : 'destructive'}>
        {getValue() ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    header: 'Created At',
    accessorKey: 'created_at',
    id:'created_at',
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
  {
    header: 'Updated At',
    accessorKey: 'updated_at',
    id:'updated_at',
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
]

export default function UserListTable() {
  const authroles = useAppSelector((state) => state.roles) as string[]

  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Detail Modal
  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal: closeDetailModal,
    detailLoading,
  } = useDetailModal<IUser>('/users')

  // Table State
  const {
    data,
    totalCount,
    loading,
    globalFilter,
    setGlobalFilter,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    fetchData,
  } = useTable<IUser>({
    fetcher: async ({ q, page, limit, sortBy, sortOrder }) => {
      const headers = await authorizationHeader()
      const res = await api.get('/users', {
        headers,
        params: {
          q,
          page,
          limit,
          sortBy: sortBy || 'created_at',
          sortOrder: sortOrder || 'desc',
        },
      })
      return {
        data: res.data.users,
        total: res.data.totalCount,
      }
    },
    initialColumns: [],
    defaultSort: 'created_at',
  })

  // Columns & Visibility State
  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail,
        authroles,
      }),
    [pageIndex, pageSize, fetchDetail, authroles]
  )

  // Visible columns state, initialized with all columns
  const [visible, setVisible] = useState<ColumnDef<IUser>[]>(allColumns)

  // State to control the ColumnVisibilityManager modal visibility
  const [showColumnModal, setShowColumnModal] = useState(false)

  // When columns change inside the visibility manager, update the visible columns here
  const handleColumnChange = (cols: ColumnDef<IUser>[]) => {
    setVisible(cols)
    setShowColumnModal(false)
  }

  // Table instance
  const table = useReactTable({
    data,
    columns: visible,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="table-container relative space-y-2">
        <TableHeaderActions
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          onAddNew={() => setIsSheetOpen(true)}
          onColumnSettings={() => setShowColumnModal(true)}
          onPrint={() => window.print()}
          onExport={() =>
            exportExcel({ data, fileName: 'Users', sheetName: 'Users' })
          }
          addButtonLabel="Register New User"
        />

        <div className="relative rounded-sm shadow overflow-hidden bg-white">
          <div className="max-h-[600px] min-h-[200px] overflow-y-auto">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-opacity-70 mt-20">
                <TableLoader loading />
              </div>
            )}

            <table className="table-auto w-full text-left border border-collapse">
              <thead className="sticky -top-1 z-10 bg-gray-200 shadow-[-2px_6px_8px_-4px_rgba(0,0,0,0.2)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`p-2 border border-gray-300 bg-gray-200 ${
                          (header.column.columnDef.meta as { customClassName?: string })?.customClassName || ''
                        }`}
                      >
                        <div
                          className="flex justify-between items-center w-full cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? (
                              <FaSortUp size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <FaSortDown size={12} />
                            ) : (
                              <FaSort size={12} />
                            )}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2 border border-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TablePaginationFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={closeDetailModal} title="User Details">
        {detailLoading || !selectedItem ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <TableLoader loading />
          </div>
        ) : (
          <UserDetail user={selectedItem} />
        )}
      </Modal>

      <FormHolderSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Register New User"
        titleDivClassName="success-gradient"
      >
        <Register fetchData={fetchData} />
      </FormHolderSheet>

      {/* Column Visibility Manager Modal */}
      {showColumnModal && 
        <ColumnVisibilityManager
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={handleColumnChange}
        />
      }
    </motion.div>
  )
}
