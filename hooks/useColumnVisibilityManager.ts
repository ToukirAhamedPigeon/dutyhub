import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

export type ColumnKey = string

export function useColumnVisibilityManager<T>(initialColumns: ColumnDef<T, any>[]) {
  const [visible, setVisible] = useState<ColumnDef<T>[]>(initialColumns)
  const [hidden, setHidden] = useState<ColumnDef<T>[]>([])

  const reset = () => {
    setVisible(initialColumns)
    setHidden([])
  }

  const moveToHidden = (keys: ColumnKey[]) => {
    const toHide = visible.filter(col => keys.includes(col.id as string))
    setHidden(prev => [...prev, ...toHide].sort((a, b) => String(a.header).localeCompare(String(b.header))))
    setVisible(prev => prev.filter(col => !keys.includes(col.id as string)))
  }

  const moveToVisible = (keys: ColumnKey[]) => {
    const toShow = hidden.filter(col => keys.includes(col.id as string))
    setVisible(prev => [...prev, ...toShow])
    setHidden(prev => prev.filter(col => !keys.includes(col.id as string)))
  }

  const move = (keys: ColumnKey[], direction: 'up' | 'down' | 'top' | 'bottom') => {
    let newOrder = [...visible]

    if (direction === 'top') {
      newOrder = [...visible.filter(col => keys.includes(col.id as string)), ...visible.filter(col => !keys.includes(col.id as string))]
    } else if (direction === 'bottom') {
      newOrder = [...visible.filter(col => !keys.includes(col.id as string)), ...visible.filter(col => keys.includes(col.id as string))]
    } else {
      for (let i = direction === 'down' ? visible.length - 1 : 0;
           direction === 'down' ? i >= 0 : i < visible.length;
           direction === 'down' ? i-- : i++) {
        const col = visible[i]
        if (keys.includes(col.id as string)) {
          const swapIdx = direction === 'up' ? i - 1 : i + 1
          if (swapIdx >= 0 && swapIdx < visible.length) {
            [newOrder[i], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[i]]
          }
        }
      }
    }

    setVisible(newOrder)
  }

  return {
    visible,
    hidden,
    setVisible,
    setHidden,
    moveToHidden,
    moveToVisible,
    move,
    reset,
  }
}