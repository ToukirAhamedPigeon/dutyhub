'use client'

import React, { useMemo, useState, useEffect } from 'react'
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
import { useDetailModal } from '@/hooks/useDetailModal'
import Modal from '@/components/custom/Modal'
import { TableLoader, TableHeaderActions, TablePaginationFooter, IndexCell, RowActions } from '@/components/custom/Table'
import { getCustomDateTime } from '@/lib/formatDate'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'
import LogDetail from './LogDetail'
import { ILog } from '@/types'
import { useTranslations } from 'next-intl'

// Column definitions for Log list
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (itemOrId: ILog | string) => void
}): ColumnDef<ILog>[] => [
  {
    header: 'SL',
    id: 'sl',
    cell: ({ row }) => (
      <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />
    ),
    meta: { customClassName: 'text-center' },
  },
  {
    header: 'Action',
    id: 'action',
    cell: ({ row }) => (
      <button
        className="btn btn-sm btn-primary"
        onClick={() => fetchDetail(row.original)}
        type="button"
      >
        Detail
      </button>
    ),
  },
  { header: 'Detail', accessorKey: 'detail' },
  { header: 'Collection Name', accessorKey: 'collectionName' },
  { header: 'Action Type', accessorKey: 'actionType' },
  { header: 'Object ID', accessorKey: 'objectId' },
  { header: 'Created By', accessorKey: 'createdByName' },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss'),
    meta: {
      customClassName: 'text-center min-w-[150px] whitespace-nowrap',
    },
  },
]

export default function LogListTable() {
  const t = useTranslations()

  const [filters, setFilters] = useState({})
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal: closeDetailModal,
    detailLoading,
  } = useDetailModal<ILog>('/logs')

  // Pagination and sorting state
  const [data, setData] = useState<ILog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Fetch logs data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const headers = await authorizationHeader()
      const res = await api.post(
        '/logs',
        {
          q: globalFilter,
          page: pageIndex + 1,
          limit: pageSize,
          sortBy: sorting[0]?.id || 'createdAt',
          sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
          ...filters,
        },
        { headers }
      )
      setData(res.data.logs)
      setTotalCount(res.data.totalCount)
      setLoading(false)
    }
    fetchData()
  }, [pageIndex, pageSize, sorting, globalFilter, filters])

  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail,
      }),
    [pageIndex, pageSize, fetchDetail]
  )

  const table = useReactTable({
    data,
    columns: allColumns,
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
          onFilter={() => setFilterModalOpen(true)}
          isFilterActive={false}
          showAddButton={false}
          onAddNew={() => {}}
          onColumnSettings={() => {}}
          onPrint={() => {}}
          onExport={() => {}}
          addButtonLabel=""
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
                            {(() => {
                              const content = flexRender(header.column.columnDef.header, header.getContext())
                              return typeof content === 'string' ? t(content) : content
                            })()}
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

      <Modal isOpen={isModalOpen} onClose={closeDetailModal} title="Log Details">
        {detailLoading || !selectedItem ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <TableLoader loading />
          </div>
        ) : (
          (() => {
            // Transform selectedItem here before passing
            const transformedLog = {
              ...selectedItem,
              createdByName: selectedItem.createdBy?.name || 'Unknown',
              createdAt: getCustomDateTime(selectedItem.createdAt.toISOString(), 'YYYY-MM-DD HH:mm:ss'),
              changes: selectedItem.changes ? JSON.parse(selectedItem.changes) : undefined,
              objectId: selectedItem.objectId || '',
              detail: selectedItem.detail || '',
              collectionName: selectedItem.collectionName,
              actionType: selectedItem.actionType,
            };

            return <LogDetail log={transformedLog} />;
          })()
        )}
      </Modal>
    </motion.div>
  )
}
