import type { ColumnDef } from '@tanstack/react-table'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'
import { toast } from 'sonner'

export async function refreshColumnSettings<T>(
  tableId: string,
  initialColumns: ColumnDef<T, any>[],
  onChange?: (visible: ColumnDef<T, any>[]) => void
): Promise<ColumnDef<T, any>[]> {
  const LOCAL_KEY = `columnConfig:${tableId}`

  const getColumnId = (col: ColumnDef<T>): string =>
    col.id ??
    (typeof (col as any).accessorKey === 'string'
      ? (col as any).accessorKey
      : undefined) ??
    crypto.randomUUID()

  try {
    const headers = await authorizationHeader()
    const res = await api.get('/user-table-combination', {
      params: { tableId },
      headers
    })

    const visibleIds: string[] = res.data?.showColumnCombinations ?? []

    // Map columns by their IDs for quick lookup
    const columnMap: Record<string, ColumnDef<T>> = {}
    for (const col of initialColumns) {
      columnMap[getColumnId(col)] = col
    }

    // Reorder columns exactly as in visibleIds
    const matched = visibleIds
      .map(id => columnMap[id])
      .filter((col): col is ColumnDef<T> => !!col) // filter out undefined

    localStorage.setItem(LOCAL_KEY, JSON.stringify(visibleIds))
    onChange?.(matched)

    // toast.success('Column settings refreshed from database with correct order.')

    return matched
  } catch (err) {
    console.warn('Failed to refresh column settings from DB:', err)
    toast.error('Failed to refresh column settings from database')
    return []
  }
}
