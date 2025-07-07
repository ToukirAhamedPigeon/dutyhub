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
import FormHolderSheet from '@/components/custom/FormHolderSheet'
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
import Add from './Add'
import PermissionDetail from './PermissionDetail'
import { IPermission } from '@/types'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { printTableById } from '@/lib/printTable'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { FilterModal } from '@/components/custom/FilterModal'
import { PermissionFilterForm, PermissionFilters } from './PermissionFilterForm'
import EditPermission from './Edit'
import { useEditSheet } from '@/hooks/useEditSheet'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { useDeleteWithConfirm } from '@/hooks/useDeleteWithConfirm'
import { can } from '@/lib/authcheck/client'
import { useTranslations } from 'next-intl'

// 🧱 Column Definitions
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmDelete,
  showDetail=true,
  showEdit=true,
  showDelete=true,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (itemOrId: IPermission | string) => void
  handleEditClick: (user: IPermission) => void
  confirmDelete: (id: string) => void
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
}): ColumnDef<IPermission>[] => [
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
        onEdit={() => handleEditClick(row.original)}
        onDelete={() => confirmDelete(row.original._id.toString())}
        showDetail={showDetail}
        showEdit={showEdit}
        showDelete={showDelete}
      />
    ),
  },
  { header: 'Name', id: 'name', accessorKey: 'name' },
  { header: 'Guard Name', id: 'guard_name', accessorKey: 'guard_name' },
  { header: 'Created By', id: 'created_by', accessorKey: 'created_by_name' },
  {
    header: 'Created At',
    accessorKey: 'created_at',
    id: 'created_at',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string,'YYYY-MM-DD HH:mm:ss'),
    meta: {
      customClassName: 'text-center min-w-[150px] whitespace-nowrap',
    },
  },
  { header: 'Updated By', id: 'updated_by', accessorKey: 'updated_by_name' },
  {
    header: 'Updated At',
    accessorKey: 'updated_at',
    id: 'updated_at',
    cell: ({ getValue }) => getCustomDateTime(getValue() as string,'YYYY-MM-DD HH:mm:ss'),
    meta: {
      customClassName: 'text-center min-w-[150px] whitespace-nowrap',
    },
  },
]

const initialFilters: PermissionFilters = {
  name: '',
  guard_name: '',
  role_ids: [],
}

export default function PermissionListTable() {
  const t = useTranslations();
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal: closeDetailModal,
    detailLoading,
  } = useDetailModal<IPermission>('/permissions')

  const {isOpen: isEditSheetOpen,itemToEdit: permissionToEdit,openEdit: handleEditClick,closeEdit: closeEditSheet} = useEditSheet<IPermission>()

  // New filter state and modal control
const [filters, setFilters] = useState<PermissionFilters>(initialFilters)
const [filterModalOpen, setFilterModalOpen] = useState(false)
const showDetail= true
const showEdit= can(['update-permissions'])
const showDelete= can(['delete-permissions'])
const [showAddButton,setShowAddButton]= useState(false)

useEffect(() => {
  setShowAddButton(can(['create-permissions']))
},[])


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
} = useTable<IPermission>({
  fetcher: async ({ q, page, limit, sortBy, sortOrder }) => {
    const headers = await authorizationHeader();
    const res = await api.post(
      '/permissions',
      {
        q,
        page,
        limit,
        sortBy: sortBy || 'created_at',
        sortOrder: sortOrder || 'desc',
        ...(filters.name && { name: filters.name }),
        ...(filters.guard_name && { guard_name: filters.guard_name }),
        ...(filters.role_ids && filters.role_ids.length > 0 && { role_ids: filters.role_ids }),
      },
      { headers }
    );

    return {
      data: res.data.permissions,
      total: res.data.totalCount,
    };
  },
  initialColumns: [],
  defaultSort: 'created_at',
});

const isFilterActive = useMemo(() => {
  return Object.entries(filters).some(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== ''
  })
}, [filters])

const {dialogOpen,confirmDelete,cancelDelete,handleDelete,deleteLoading} = useDeleteWithConfirm({
  endpoint: '/permissions',
  onSuccess: fetchData,
})

  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail,
        handleEditClick,
        confirmDelete,
        showDetail,
        showEdit,
        showDelete,
      }),
    [pageIndex, pageSize, fetchDetail, handleEditClick, confirmDelete, showDetail, showEdit, showDelete]
  )

  

  const [visible, setVisible] = useState<ColumnDef<IPermission>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)

  useEffect(() => {
    (async () => {
      const refreshedColumns = await refreshColumnSettings<IPermission>('permissionTable', allColumns)
      setVisible(refreshedColumns)
    })()
  }, [])

  const handleColumnChange = (cols: ColumnDef<IPermission>[]) => {
    setVisible(cols)
    setShowColumnModal(false)
  }

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('permissionFilters')
    if (saved) setFilters(JSON.parse(saved))
  }, [])

  // Refetch data & save filters when filters change
  useEffect(() => {
    fetchData()
    setPageIndex(0) // Reset page on filter change
    localStorage.setItem('permissionFilters', JSON.stringify(filters))
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
        onAddNew={() => setIsSheetOpen(true)}
        showAddButton={showAddButton}
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-user-table', 'Permission Table')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Permissions',
            sheetName: 'Permissions',
          })
        }
        addButtonLabel="Add New Permission"
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

      {showDetail && <Modal isOpen={isModalOpen} onClose={closeDetailModal} title="Permission Details">
        {detailLoading || !selectedItem ? (
          <div className="flex items-center justify-center min-h-[150px]">
            <TableLoader loading />
          </div>
        ) : (
          <PermissionDetail permission={selectedItem} />
        )}
      </Modal>}

      {showAddButton && <FormHolderSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Add New Permission"
        titleDivClassName="success-gradient"
      >
        <Add fetchData={fetchData} />
      </FormHolderSheet>}

       {/* Edit Modal */}  
      {showEdit && <FormHolderSheet
        open={isEditSheetOpen}
        onOpenChange={closeEditSheet}
        title="Edit Permission"
        titleDivClassName="warning-gradient"
      >
        {permissionToEdit && (
          <EditPermission
            permission={permissionToEdit}
            onClose={closeEditSheet}
            fetchData={async () => {
              //closeEditSheet()
              fetchData()
            }}
          />
        )}
      </FormHolderSheet>}

      {showColumnModal && (
        <ColumnVisibilityManager<IPermission>
          tableId="permissionTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={handleColumnChange}
        />
      )}

      <FilterModal
        tableId="permissionTable"
        title="Filter Permissions"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setFilterModalOpen(false)
        }}
        initialFilters={initialFilters}
        renderForm={(filterValues, setFilterValues) => (
          <PermissionFilterForm
            filterValues={filterValues}             // ✅ MATCHES expected prop
            setFilterValues={setFilterValues}       // ✅ MATCHES expected prop
            onClose={() => setFilterModalOpen(false)}
          />
        )}
      />

      {/* Confirm Dialog */}
      {showDelete && <ConfirmDialog
        open={dialogOpen}
        onCancel={cancelDelete}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete"
        confirmLabel={deleteLoading ? 'Deleting' : 'Delete'}
        loading={deleteLoading}
      />}

    </motion.div>
  )
}
