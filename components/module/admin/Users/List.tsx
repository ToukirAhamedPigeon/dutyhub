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
import { useColumnVisibilityManager } from '@/hooks/useColumnVisibilityManager'
import Modal from '@/components/custom/Modal'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import Fancybox from '@/components/custom/FancyBox'
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell,
  ColumnSettingsModal
} from '@/components/custom/Table'

import { Badge } from '@/components/ui/badge'

import { formatDateTime, formatDateTimeDisplay, getAge } from '@/lib/formatDate'
import { capitalize, exportExcel } from '@/lib/helpers'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'

import Register from './Register'
import UserDetail from './UserDetail'

import { IUser } from '@/types'

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
    cell: ({ row }) => (
      <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />
    ),
    meta: { customClassName: 'text-center' },
  },
  {
    header: 'Action',
    cell: ({ row }) => (
      <RowActions
        row={row.original}
        onDetail={() => fetchDetail(row.original._id.toString())}
      />
    ),
  },
  { header: 'Name', accessorKey: 'name' },
  { header: 'Username', accessorKey: 'username' },
  { header: 'BP No', accessorKey: 'bp_no' },
  { header: 'Phone 1', accessorKey: 'phone_1' },
  { header: 'Email', accessorKey: 'email' },
  { header: 'Address', accessorKey: 'address' },
  ...(authroles.includes('developer')
    ? [{ header: 'Decrypted Password', accessorKey: 'decrypted_password' }]
    : []),
  {
    header: 'Profile Picture',
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
    accessorKey: 'roleNames',
    cell: ({ getValue }) => capitalize(getValue() as string),
  },
  { header: 'Blood Group', accessorKey: 'blood_group' },
  { header: 'NID', accessorKey: 'nid' },
  {
    header: 'Date of Birth',
    accessorKey: 'dob',
    cell: ({ getValue }) =>
      getValue()
        ? `${formatDateTimeDisplay(getValue() as string, false)} Age: ${getAge(
            getValue() as string,
            false,
            false
          )}`
        : '-',
    meta: {
      customClassName: 'text-center min-w-[300px] whitespace-nowrap',
    },
  },
  {
    header: 'Current Status',
    accessorKey: 'current_status',
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? 'success' : 'destructive'}>
        {getValue() ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    header: 'Created At',
    accessorKey: 'created_at',
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
  {
    header: 'Updated At',
    accessorKey: 'updated_at',
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
]

export default function UserListTable() {
  const authroles = useAppSelector((state) => state.roles) as string[]
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showColumnModal, setShowColumnModal] = useState(false)

  // 1. Detail modal (needs to come before fetchDetail usage)
  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal: closeDetailModal,
    detailLoading,
  } = useDetailModal<IUser>('/users')

  // 2. Table
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
        data: res.data.users as IUser[],
        total: res.data.totalCount,
      }
    },
    initialColumns: [], // placeholder, will replace after memo
    defaultSort: 'created_at',
  })

  // 3. Memoize columns now that dependencies exist
  const allColumns: ColumnDef<IUser>[] = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail,
        authroles,
      }),
    [pageIndex, pageSize, fetchDetail, authroles]
  )

  // 4. Apply column visibility manager
  const {
    visible,
    hidden,
    moveToHidden,
    moveToVisible,
    move,
    reset,
    setVisible,
    setHidden,
  } = useColumnVisibilityManager<IUser>(allColumns)

  const table = useReactTable({
    data,
    columns: visible as ColumnDef<any>[],
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
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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

      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={closeDetailModal} title="User Details">
        {detailLoading || !selectedItem ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <TableLoader loading />
          </div>
        ) : (
          <UserDetail user={selectedItem} />
        )}
      </Modal>

      {/* Register New User Drawer */}
      <FormHolderSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Register New User"
        titleDivClassName="success-gradient"
      >
        <Register fetchData={fetchData} />
      </FormHolderSheet>

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        onSave={(cols) => setVisible(cols)}
        visible={visible}
        hidden={hidden}
        moveToHidden={moveToHidden}
        moveToVisible={moveToVisible}
        move={move}
        reset={reset}
        setVisible={setVisible}
        setHidden={setHidden}
      />
    </motion.div>
  )
}
