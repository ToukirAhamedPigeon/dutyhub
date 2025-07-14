'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  OnChangeFn,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import Modal from '@/components/custom/Modal'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import {
  TableHeaderActions,
  TablePaginationFooter,
  TableLoader,
  RowActions,
  IndexCell,
} from '@/components/custom/Table'
import { getCustomDateTime } from '@/lib/formatDate'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'
import { ILookup } from '@/types'
import LookupDetail from './LookupDetail'
import AddLookup from './Add'
import EditLookup from './Edit'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { printTableById } from '@/lib/printTable'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { FilterModal } from '@/components/custom/FilterModal'
import { useEditSheet } from '@/hooks/useEditSheet'
import { useDeleteWithConfirm } from '@/hooks/useDeleteWithConfirm'
import { can } from '@/lib/authcheck/client'
import { LookupFilters, LookupFilterForm } from './LookupFilterForm'

const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmDelete,
  showDetail = true,
  showEdit = true,
  showDelete = true,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (itemOrId: ILookup | string) => void
  handleEditClick: (lookup: ILookup) => void
  confirmDelete: (id: string) => void
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
}): ColumnDef<ILookup>[] => [
  {
    header: 'SL',
    id: 'sl',
    cell: ({ row }) => <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />,
    meta: { customClassName: 'text-center' },
  },
  {
    header: 'Action',
    id: 'action',
    cell: ({ row }) => (
      <RowActions
        row={row.original}
        onDetail={() => fetchDetail(row.original)}
        onEdit={() => handleEditClick(row.original)}
        onDelete={() => confirmDelete(row.original._id.toString())}
        showDetail={showDetail}
        showEdit={showEdit}
        showDelete={showDelete}
      />
    ),
  },
  { header: 'Name', accessorKey: 'name', id: 'name' },
  { header: 'BN Name', accessorKey: 'bn_name', id: 'bn_name' },
  { header: 'Parent', accessorKey: 'parent_name', id: 'parent_name' },
  { header: 'Alt Parent', accessorKey: 'alt_parent_name', id: 'alt_parent_name' },
  { header: 'Created By', accessorKey: 'creator_user_name', id: 'creator_user_name' },
  { header: 'Updated By', accessorKey: 'updater_user_name', id: 'updater_user_name' },
  {
    header: 'Created At',
    accessorKey: 'created_at',
    id: 'created_at',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss'),
  },
  {
    header: 'Updated At',
    accessorKey: 'updated_at',
    id: 'updated_at',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss'),
  },
]

const initialFilters: LookupFilters = {
  name: '',
  bn_name: '',
  parent_id: '',
  alt_parent_id: '',
}

export default function LookupListTable() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [filters, setFilters] = useState<LookupFilters>(initialFilters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [visible, setVisible] = useState<ColumnDef<ILookup>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const showDetail = true
  const showEdit = can(['update-lookups'])
  const showDelete = can(['delete-lookups'])
  const [showAddButton, setShowAddButton] = useState(false)

  useEffect(() => {
    setShowAddButton(can(['create-lookups']))
  }, [])

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading,
  } = useDetailModal<ILookup>('/lookups')

  const { isOpen: isEditSheetOpen, itemToEdit, openEdit, closeEdit } = useEditSheet<ILookup>()

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
  } = useTable<ILookup>({
    fetcher: async ({ q, page, limit, sortBy, sortOrder }) => {
      const headers = await authorizationHeader()
      const res = await api.post('/lookups', {
        q,
        page,
        limit,
        sortBy: sortBy || 'created_at',
        sortOrder: sortOrder || 'desc',
        ...filters,
      }, { headers })

      return {
        data: res.data.lookups,
        total: res.data.totalCount,
      }
    },
    initialColumns: [],
    defaultSort: 'created_at',
  })

  const isFilterActive = useMemo(() => {
    return Object.values(filters).some((val) => val && val !== '')
  }, [filters])

  const { dialogOpen, confirmDelete, cancelDelete, handleDelete, deleteLoading } = useDeleteWithConfirm({
    endpoint: '/lookups',
    onSuccess: fetchData,
  })

  const allColumns = useMemo(() => getAllColumns({
    pageIndex,
    pageSize,
    fetchDetail,
    handleEditClick: openEdit,
    confirmDelete,
    showDetail,
    showEdit,
    showDelete,
  }), [pageIndex, pageSize, fetchDetail, openEdit, confirmDelete])

  useEffect(() => {
    setVisible(allColumns)
  }, [allColumns])

  useEffect(() => {
    fetchData()
    setPageIndex(0)
  }, [filters])

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

  const visibleIds = visible.map((col) => col.id ?? (typeof (col as any).accessorKey === 'string' ? (col as any).accessorKey : ''))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <TableHeaderActions
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onAddNew={() => setIsSheetOpen(true)}
        showAddButton={showAddButton}
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-lookup-table', 'Lookup Table')}
        onExport={() => exportVisibleTableToExcel({ data, columns: allColumns, visibleColumnIds: visibleIds, fileName: 'Lookups', sheetName: 'Lookups' })}
        addButtonLabel="Add New Lookup"
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />

      <div className="relative rounded shadow bg-white" id="printable-lookup-table">
        <div className="overflow-y-auto max-h-[600px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-opacity-70 z-10">
              <TableLoader loading />
            </div>
          )}
          <table className="table-auto w-full text-left border">
            <thead className="sticky top-0 bg-gray-200 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-2 border">
                      <div className="flex justify-between cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                        <span>{header.column.columnDef.header as string}</span>
                        <span>
                          {header.column.getIsSorted() === 'asc' ? <FaSortUp size={12} /> :
                           header.column.getIsSorted() === 'desc' ? <FaSortDown size={12} /> :
                           <FaSort size={12} />}
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
                    <td key={cell.id} className="p-2 border">
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Lookup Details">
        {detailLoading || !selectedItem ? <TableLoader loading /> : <LookupDetail lookup={selectedItem} />}
      </Modal>

      {showAddButton && <FormHolderSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} title="Add New Lookup">
        <AddLookup fetchData={fetchData} />
      </FormHolderSheet>}

      {showEdit && <FormHolderSheet open={isEditSheetOpen} onOpenChange={closeEdit} title="Edit Lookup">
        {itemToEdit && <EditLookup lookup={itemToEdit} onClose={closeEdit} fetchData={fetchData} />}
      </FormHolderSheet>}

      <FilterModal
        tableId="lookupTable"
        title="Filter Lookups"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setFilterModalOpen(false)
        }}
        initialFilters={initialFilters}
        renderForm={(filterValues, setFilterValues) => (
          <LookupFilterForm filterValues={filterValues} setFilterValues={setFilterValues} onClose={() => setFilterModalOpen(false)} />
        )}
      />

      {showColumnModal && (
        <ColumnVisibilityManager<ILookup>
          tableId="lookupTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={(cols) => { setVisible(cols); setShowColumnModal(false) }}
        />
      )}
    </motion.div>
  )
}