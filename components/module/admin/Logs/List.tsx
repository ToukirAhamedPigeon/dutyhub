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
import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import Modal from '@/components/custom/Modal'
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell,
} from '@/components/custom/Table'
import { getCustomDateTime } from '@/lib/formatDate'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'
import LogDetail from './LogDetail'
import { ILog } from '@/types'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { printTableById } from '@/lib/printTable'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { FilterModal } from '@/components/custom/FilterModal'
import { LogFilterForm, LogFilters } from './LogFilterForm'
import { useTranslations } from 'next-intl'
import { parseChanges } from '@/lib/helpers'

// 🧱 Column Definitions
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  showDetail=true
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (itemOrId: ILog | string) => void
  showDetail?: boolean
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
      <RowActions
        row={row.original}
        onDetail={() => fetchDetail(row.original)}
        showDetail={showDetail}
      />
    ),
  },
  { header: 'Detail', id: 'detail', accessorKey: 'detail' },
  { header: 'Collection Name', id: 'collectionName', accessorKey: 'collectionName' },
  { header: 'Action Type', id: 'actionType', accessorKey: 'actionType' },
  { header: 'Object ID', id: 'objectId', accessorKey: 'objectId' },
  { header: 'Created By', id: 'createdBy', accessorKey: 'createdByName' },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    id: 'createdAt',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string,'YYYY-MM-DD HH:mm:ss'),
    meta: {
      customClassName: 'text-center min-w-[150px] whitespace-nowrap',
    },
  }
]

const initialFilters: LogFilters = {
  collectionName: [],
  actionType: [],
  createdBy: [],
  createdAtFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  createdAtTo: new Date(),
}

export default function LogListTable() {
  const t = useTranslations();
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal: closeDetailModal,
    detailLoading,
  } = useDetailModal<ILog>('/logs')


  // New filter state and modal control
const [filters, setFilters] = useState<LogFilters>(initialFilters)
const [filterModalOpen, setFilterModalOpen] = useState(false)
const showDetail= true


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
} = useTable<ILog>({
  fetcher: async ({ q, page, limit, sortBy, sortOrder }) => {
    const headers = await authorizationHeader();
    const res = await api.post(
      '/logs',
      {
        q,
        page,
        limit,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        ...(filters.createdAtFrom && { createdAtFrom: filters.createdAtFrom }),
        ...(filters.createdAtTo && { createdAtTo: filters.createdAtTo }),
        ...(filters.collectionName && filters.collectionName.length > 0 && { collectionName: filters.collectionName }),
        ...(filters.actionType && filters.actionType.length > 0 && { actionType: filters.actionType }),
        ...(filters.createdBy && filters.createdBy.length > 0 && { createdBy: filters.createdBy }),
      },
      { headers }
    );

    return {
      data: res.data.logs,
      total: res.data.totalCount,
    };
  },
  initialColumns: [],
  defaultSort: 'createdAt',
});

const isFilterActive = useMemo(() => {
  return Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== ''
  })
}, [filters])


  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail,
        showDetail
      }),
    [pageIndex, pageSize, fetchDetail, showDetail]
  )

  

  const [visible, setVisible] = useState<ColumnDef<ILog>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)

  useEffect(() => {
    (async () => {
      const refreshedColumns = await refreshColumnSettings<ILog>('logTable', allColumns)
      setVisible(refreshedColumns)
    })()
  }, [])

  const handleColumnChange = (cols: ColumnDef<ILog>[]) => {
    setVisible(cols)
    setShowColumnModal(false)
  }

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('logFilters')
    if (saved) setFilters(JSON.parse(saved))
  }, [])

  // Refetch data & save filters when filters change
  useEffect(() => {
    fetchData()
    setPageIndex(0) // Reset page on filter change
    localStorage.setItem('logFilters', JSON.stringify(filters))
  }, [filters])

  // ✅ Correct visible column IDs for export
  const visibleIds = visible.map(
    (col) =>
      col.id ??
      (typeof (col as any).accessorKey === 'string' ? (col as any).accessorKey : '')
  )

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
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-user-table', 'Log Table')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Logs',
            sheetName: 'Logs',
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />

        <div className="relative rounded-sm shadow overflow-hidden bg-white" id="printable-user-table">
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
                              const content = flexRender(header.column.columnDef.header, header.getContext());
                              return typeof content === "string" ? t(content) : content;
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

      {showDetail && <Modal isOpen={isModalOpen} onClose={closeDetailModal} title="Log Details">
        {detailLoading || !selectedItem ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <TableLoader loading />
          </div>
        ) : (
          <LogDetail
            log={{
              ...selectedItem,
              objectId: selectedItem.objectId ?? 'N/A',
              createdByName: selectedItem.createdByName ?? 'Unknown User',
              createdAt: selectedItem.createdAt.toString(), // Ensure it's a string
              changes: parseChanges(selectedItem.changes),
            }}
          />
        )}
      </Modal>}


      {showColumnModal && (
        <ColumnVisibilityManager<ILog>
          tableId="logTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={handleColumnChange}
        />
      )}

      <FilterModal
        tableId="logTable"
        title="Filter Logs"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setFilterModalOpen(false)
        }}
        initialFilters={initialFilters}
        renderForm={(filterValues, setFilterValues) => (
          <LogFilterForm
            filterValues={filterValues}             // ✅ MATCHES expected prop
            setFilterValues={setFilterValues}       // ✅ MATCHES expected prop
            onClose={() => setFilterModalOpen(false)}
          />
        )}
      />

    </motion.div>
  )
}
