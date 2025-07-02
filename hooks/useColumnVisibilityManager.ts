import { useState, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

export type ColumnKey = string

export function useColumnVisibilityManager<T>(initialColumns: ColumnDef<T, any>[]) {
  const [visible, setVisible] = useState<ColumnDef<T>[]>(initialColumns)
  const [hidden, setHidden] = useState<ColumnDef<T>[]>([])

  const reset = () => {
    setVisible(initialColumns)
    setHidden([])
  }

  function getColumnId(col: ColumnDef<T>): string {
    return (
      col.id ??
      (typeof (col as any).accessorKey === 'string' ? (col as any).accessorKey : undefined) ??
      crypto.randomUUID() // fallback to something guaranteed unique
    )
  }

  const moveToHidden = (keys: ColumnKey[]) => {
    const toHide = visible.filter(col => keys.includes(getColumnId(col)))
    setHidden(prev =>
      [...prev, ...toHide].sort((a, b) =>
        String(a.header).localeCompare(String(b.header))
      )
    )
    setVisible(prev => prev.filter(col => !keys.includes(getColumnId(col))))
  }

  const moveToVisible = (keys: ColumnKey[]) => {
    const toShow = hidden.filter(col => keys.includes(getColumnId(col)))
    setVisible(prev => [...prev, ...toShow])
    setHidden(prev => prev.filter(col => !keys.includes(getColumnId(col))))
  }

  const move = (keys: ColumnKey[], direction: 'up' | 'down' | 'top' | 'bottom') => {
    let current = [...visible]
    const getId = (col: ColumnDef<T>) => getColumnId(col)

    if (direction === 'top') {
      const toMove = current.filter(col => keys.includes(getId(col)))
      const rest = current.filter(col => !keys.includes(getId(col)))
      setVisible([...toMove, ...rest])
    } else if (direction === 'bottom') {
      const toMove = current.filter(col => keys.includes(getId(col)))
      const rest = current.filter(col => !keys.includes(getId(col)))
      setVisible([...rest, ...toMove])
    } else {
      const getIndex = (id: string) => current.findIndex(col => getId(col) === id)

      for (const id of direction === 'down' ? [...keys].reverse() : keys) {
        const i = getIndex(id)
        const swapWith = direction === 'up' ? i - 1 : i + 1
        if (i >= 0 && swapWith >= 0 && swapWith < current.length) {
          const temp = current[i]
          current[i] = current[swapWith]
          current[swapWith] = temp
        }
      }
      setVisible(current)
    }
  }

  const onSave = useCallback(
    (cols: ColumnDef<T>[]) => {
      setVisible(cols)
      const remaining = hidden.filter(
        col => !cols.some(c => getColumnId(c) === getColumnId(col))
      )
      setHidden(remaining)
    },
    [hidden]
  )

  return {
    visible,
    hidden,
    setVisible,
    setHidden,
    moveToHidden,
    moveToVisible,
    move,
    reset,
    onSave,
  }
}
