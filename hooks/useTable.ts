import { useState, useEffect } from 'react'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, OnChangeFn, SortingState } from '@tanstack/react-table'

type FetcherParams = {
    q: string
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  
  type UseTableOptions<T> = {
    fetcher: (params: FetcherParams) => Promise<{ data: T[]; totalCount: number }>
  }
  

export function useTable<T>({ fetcher, defaultSort = 'createdAt' }: {
  fetcher: (params: {
    q: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
  }) => Promise<{ data: T[], total: number }>,
  defaultSort?: string,
}) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const fetchData = async () => {
    setLoading(true)
    const sortBy = sorting.length ? (sorting[0] as any).id : defaultSort
    const sortOrder = sorting.length ? ((sorting[0] as any).desc ? 'desc' : 'asc') : 'desc'

    try {
        const res = await fetcher({
            q: globalFilter,
            page: pageIndex + 1,
            limit: pageSize,
            sortBy,
            sortOrder,
          })
      setData(res.data)
      setTotalCount(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [globalFilter, pageIndex, pageSize, sorting])

  const table = useReactTable({
    data,
    columns: [],
    state: { sorting, pagination: { pageIndex, pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
  })

  return {
    data,
    loading,
    table,
    globalFilter,
    setGlobalFilter,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    sorting,
    setSorting,
    fetchData,
    totalCount,
  }
}
