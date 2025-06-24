'use client'
import React, { useMemo } from 'react'
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, ColumnDef, SortingState, OnChangeFn} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import { useDeleteWithConfirm } from '@/hooks/useDeleteWithConfirm'
import Modal from '@/components/custom/Modal'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import UserDetail from './UserDetail'
import {RowActions,IndexCell,TableHeaderActions,TablePaginationFooter,TableLoader} from '@/components/custom/Table'
import { formatDateTime } from '@/lib/formatDate'
import { capitalize, exportExcel } from '@/lib/helpers'
import Fancybox from '@/components/custom/FancyBox'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/axios'
import { IUser } from '@/types'
import { authorizationHeader } from '@/lib/tokens';
import { useAppSelector } from '@/hooks/useRedux';

export default function UserListTable() {
  //Router Hook
  const router = useRouter()
  const authroles = useAppSelector((state) => state.roles) as string[];
  
  //Auth Hook

  //Table Hook
  const { data, totalCount, loading, globalFilter, setGlobalFilter, sorting, setSorting, pageIndex, setPageIndex, pageSize, setPageSize, fetchData,} =
   useTable<IUser>({
    fetcher: async ({ q, page, limit, sortBy, sortOrder }) => {
      const headers = await authorizationHeader();
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

      //console.log(res.data) // Add this line to log the response data t
  
      return {
        data: res.data.users as IUser[],
        total: res.data.totalCount,
      }
    },
  })

  //Detail Modal Hook
  const {isModalOpen,selectedItem,fetchDetail,closeModal: closeDetailModal} = useDetailModal<IUser>('/users')

  //Edit Modal Hook
  // const {isOpen: isEditModalOpen,itemToEdit: userToEdit,openEdit: handleEditClick,closeEdit: closeEditModal} = useEditModal<IUser>()

  //Delete Modal Hook
  // const {dialogOpen,confirmDelete,cancelDelete,handleDelete} = useDeleteWithConfirm({
  //   endpoint: '/users',
  //   onSuccess: fetchData,
  // })

  //Columns
  const columns = useMemo<ColumnDef<IUser>[]>(() => [
    {
      header: 'SL',
      cell: ({ row }) => (
        <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />
      ),
      meta: {
        customClassName: 'text-center',
      },
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <RowActions
          row={row.original}
          onDetail={() => fetchDetail(row.original._id.toString())}
          // onEdit={() => handleEditClick(row.original)}
          // onDelete={() => confirmDelete(row.original._id.toString())}
        />
      ),
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    ...(authroles.includes('developer')
      ? [{
          header: 'Decrypted Password',
          accessorKey: 'decrypted_password',
        }]
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
  ], [
    pageIndex
  ])

  //Table
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<any>[],
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
    //Main Container
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className='table-container relative'>
      {/* Header Actions */}
      <TableHeaderActions
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onAddNew={() => router.push('/admin/users/register')}
        onPrint={() => window.print()}
        onExport={() => exportExcel({ data, fileName: 'Users', sheetName: 'Users' })}
        addButtonLabel="Register New User"
      />

      {/* Table */}
     
      <TableLoader loading={loading} />
      <div className="relative overflow-auto rounded-xl shadow">
        <table className="table-auto w-full text-left border">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-100">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`p-2 border ${
                      (header.column.columnDef.meta as { customClassName?: string })?.customClassName || ''
                    }`}
                  >
                    <div
                      className="flex justify-between items-center w-full cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
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
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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
        <UserDetail user={selectedItem} />
      </Modal>

      {/* Edit Modal */}  
      {/*<Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit User"
        titleClassName="text-2xl font-bold text-gray-700 text-center"
      >
        {userToEdit && (
          <EditUserForm
            user={userToEdit}
            onClose={closeEditModal}
            onSuccess={() => {
              closeEditModal()
              fetchData()
            }}
          />
        )}
      </Modal>*/}

      {/* Confirm Dialog */}
      {/* <ConfirmDialog
        open={dialogOpen}
        onCancel={cancelDelete}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user?"
        confirmLabel="Delete"
      /> */}
    </motion.div>
  )
}
