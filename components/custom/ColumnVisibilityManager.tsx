'use client'

import React, {
  useEffect,
  useState,
  type MouseEvent
} from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowUp, ArrowDown, ArrowBigUp, ArrowBigDown,
  ArrowRight, ArrowLeft, ArrowBigLeft, ArrowBigRight, RotateCw
} from 'lucide-react'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'
import { toast } from 'sonner'
import { formatLabel } from '@/lib/helpers'

export type ColumnKey = string

interface ColumnVisibilityManagerProps<T> {
  tableId: string
  initialColumns: ColumnDef<T, any>[]
  open: boolean
  onClose: () => void
  onChange?: (visibleColumns: ColumnDef<T, any>[]) => void
}

export function ColumnVisibilityManager<T>({
  tableId,
  initialColumns,
  open,
  onClose,
  onChange
}: ColumnVisibilityManagerProps<T>) {
  const [visible, setVisible] = useState<ColumnDef<T>[]>([])
  const [selectedVisible, setSelectedVisible] = useState<string[]>([])
  const [selectedHidden, setSelectedHidden] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const LOCAL_KEY = `columnConfig:${tableId}`

  const getColumnId = (col: ColumnDef<T>): string =>
    col.id ?? (typeof (col as any).accessorKey === 'string'
      ? (col as any).accessorKey
      : undefined) ?? crypto.randomUUID()

      const refreshFromDB = async () => {
        try {
          const headers = await authorizationHeader()
          const res = await api.get('/user-table-combination', {
            params: { tableId },
            headers,
          })
      
          const data = res.data
          const visibleIds: string[] = data?.showColumnCombinations ?? []
      
          // Create a lookup map for fast access
          const columnMap: Record<string, ColumnDef<T>> = {}
          for (const col of initialColumns) {
            columnMap[getColumnId(col)] = col
          }
      
          // Map over visibleIds to preserve order, filter out any missing columns
          const matched = visibleIds
            .map(id => columnMap[id])
            .filter((col): col is ColumnDef<T> => !!col)
      
          setVisible(matched)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(visibleIds))
          setSelectedVisible([])
          setSelectedHidden([])
          setSearch('')
      
          toast.success('Column settings refreshed from database')
        } catch (err) {
          console.warn('Failed to refresh column settings from DB:', err)
          toast.error('Failed to refresh column settings from database')
        }
      }

  useEffect(() => {
    loadSettings()
  },[])
  const loadSettings = async () => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) {
      const visibleIds: string[] = JSON.parse(stored)
  
      // Create a lookup map from initialColumns
      const columnMap: Record<string, ColumnDef<T>> = {}
      for (const col of initialColumns) {
        columnMap[getColumnId(col)] = col
      }
  
      // Reconstruct visible columns in the stored order
      const matched = visibleIds
        .map(id => columnMap[id])
        .filter((col): col is ColumnDef<T> => !!col) // Filter out missing ones
  
      setVisible(matched)
    } else {
      await refreshFromDB()
    }
  
    setSelectedVisible([])
    setSelectedHidden([])
    setSearch('')
  }

  const allIds = initialColumns.map(getColumnId)
  const visibleIds = visible.map(getColumnId)
  const hidden = initialColumns
    .filter(col => !visibleIds.includes(getColumnId(col)))
    .sort((a, b) => String(a.header).localeCompare(String(b.header)))

  const moveToHidden = (keys: ColumnKey[]) => {
    setVisible(prev => prev.filter(col => !keys.includes(getColumnId(col))))
  }

  const moveToVisible = (keys: ColumnKey[]) => {
    const toShow = initialColumns.filter(
      col => keys.includes(getColumnId(col)) && !visibleIds.includes(getColumnId(col))
    )
    setVisible(prev => [...prev, ...toShow])
  }

  const move = (keys: ColumnKey[], direction: 'up' | 'down' | 'top' | 'bottom') => {
    let current = [...visible]
    const getId = (col: ColumnDef<T>) => getColumnId(col)

    if (direction === 'top' || direction === 'bottom') {
      const toMove = current.filter(col => keys.includes(getId(col)))
      const rest = current.filter(col => !keys.includes(getId(col)))
      setVisible(direction === 'top' ? [...toMove, ...rest] : [...rest, ...toMove])
      return
    }

    const getIndex = (id: string) => current.findIndex(col => getId(col) === id)
    const keyList = direction === 'down' ? [...keys].reverse() : keys

    for (const id of keyList) {
      const i = getIndex(id)
      const j = direction === 'up' ? i - 1 : i + 1
      if (i >= 0 && j >= 0 && j < current.length) {
        [current[i], current[j]] = [current[j], current[i]]
      }
    }
    setVisible(current)
  }

  const handleSelect = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    e: MouseEvent
  ) => {
    if (e.metaKey || e.ctrlKey) {
      setSelected(selected.includes(id)
        ? selected.filter(i => i !== id)
        : [...selected, id])
    } else {
      setSelected([id])
    }
  }

  const onSave = async () => {
    const visibleColumnIds = visible.map(getColumnId)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(visibleColumnIds))
    onChange?.(visible)
    onClose()

    try {
      const headers = await authorizationHeader()
      const res = await api.put(
        '/user-table-combination',
        {
          tableId,
          showColumnCombinations: visibleColumnIds
        },
        { headers }
      )

      const formattedTable = formatLabel(tableId, 'sentence')
      if (res.status === 200 && res.data?.success) {
        toast.success(`Saved column settings for ${formattedTable}`, {
          style: { background: 'green', color: 'white' }
        })
      } else {
        toast.error(`Failed to save settings for ${formattedTable}`, {
          style: { background: 'red', color: 'white' }
        })
      }
    } catch (err) {
      console.warn('Save error:', err)
      toast.error(`Error saving settings for ${formatLabel(tableId, 'sentence')}`, {
        style: { background: 'red', color: 'white' }
      })
    }
  }

  const reset = () => {
    setVisible(initialColumns)
    setSelectedVisible([])
    setSelectedHidden([])
    setSearch('')
    localStorage.removeItem(LOCAL_KEY)
  }

  const filteredHidden = hidden.filter(col =>
    (String(col.header) || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) loadSettings()
        else onClose()
      }}
    >
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl min-h-[95vh] overflow-auto [&>[data-radix-dialog-close]]:hidden">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[42%_8%_42%] gap-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-bold mb-2">Display</h3>
            <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
              {visible.map(col => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300">
                    <div
                      onDoubleClick={() => moveToHidden([colId])}
                      onClick={e => handleSelect(colId, selectedVisible, setSelectedVisible, e)}
                      className={`w-full py-1 px-2 cursor-pointer ${selectedVisible.includes(colId) ? 'bg-blue-200' : ''}`}
                    >
                      {String(col.header)}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
            <div className="flex flex-wrap gap-1 mt-2 items-center justify-center">
              <Button title="Move Up" size="xs" onClick={() => move(selectedVisible, 'up')}><ArrowUp /></Button>
              <Button title="Move Down" size="xs" onClick={() => move(selectedVisible, 'down')}><ArrowDown /></Button>
              <Button title="Move to Top" size="xs" onClick={() => move(selectedVisible, 'top')}><ArrowBigUp /></Button>
              <Button title="Move to Bottom" size="xs" onClick={() => move(selectedVisible, 'bottom')}><ArrowBigDown /></Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center items-center gap-2">
            <Button title="Move to Do not Display" size="xs" onClick={() => moveToHidden(selectedVisible)}><ArrowRight /></Button>
            <Button title="Move to Display" size="xs" onClick={() => moveToVisible(selectedHidden)}><ArrowLeft /></Button>
            <Button title="Hide All" size="xs" onClick={() => moveToHidden(visible.map(getColumnId))}><ArrowBigRight /></Button>
            <Button title="Show All" size="xs" onClick={() => moveToVisible(hidden.map(getColumnId))}><ArrowBigLeft /></Button>
          </div>

          {/* Hidden Columns */}
          <div>
            <h3 className="font-bold mb-2">Do Not Display</h3>
            <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
              {filteredHidden.map(col => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300">
                    <div
                      onDoubleClick={() => moveToVisible([colId])}
                      onClick={e => handleSelect(colId, selectedHidden, setSelectedHidden, e)}
                      className={`w-full py-1 px-2 cursor-pointer ${selectedHidden.includes(colId) ? 'bg-blue-200' : ''}`}
                    >
                      {String(col.header)}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
            <Input
              placeholder="Filter columns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-center items-center sm:justify-end mt-4 flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={onSave} disabled={visible.length === 0}>Save</Button>
            <Button variant="outline" size="sm" onClick={refreshFromDB}><RotateCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
            <Button variant="destructive" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
