import React, { useState, useEffect } from 'react'
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
  ArrowUp,
  ArrowDown,
  ArrowBigUp,
  ArrowBigDown,
  ArrowRight,
  ArrowLeft,
  ArrowBigLeft,
  ArrowBigRight
} from 'lucide-react'

export type ColumnKey = string

interface ColumnVisibilityManagerProps<T> {
  initialColumns: ColumnDef<T, any>[]
  open: boolean
  onClose: () => void
  onChange?: (visibleColumns: ColumnDef<T, any>[]) => void
}

export function ColumnVisibilityManager<T>({
  initialColumns,
  open,
  onClose,
  onChange,
}: ColumnVisibilityManagerProps<T>) {
  const [visible, setVisible] = useState<ColumnDef<T>[]>(initialColumns)
  const [hidden, setHidden] = useState<ColumnDef<T>[]>([])

  useEffect(() => {
    if (open) {
      setVisible(initialColumns)
      setHidden([])
    }
  }, [open, initialColumns])

  const reset = () => {
    setVisible(initialColumns)
    setHidden([])
  }

  function getColumnId(col: ColumnDef<T>): string {
    return (
      col.id ??
      (typeof (col as any).accessorKey === 'string' ? (col as any).accessorKey : undefined) ??
      crypto.randomUUID()
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

  const [selectedVisible, setSelectedVisible] = useState<string[]>([])
  const [selectedHidden, setSelectedHidden] = useState<string[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setSelectedVisible([])
      setSelectedHidden([])
      setSearch('')
    }
  }, [open])

  const filteredHidden = hidden.filter(col =>
    (String(col.header) || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    e: React.MouseEvent
  ) => {
    if (e.metaKey || e.ctrlKey) {
      setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id])
    } else {
      setSelected([id])
    }
  }

  const onSave = () => {
    onChange?.(visible)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl min-h-[95vh] overflow-auto [&>[data-radix-dialog-close]]:hidden">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[42%_8%_42%] gap-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-bold mb-2">Display</h3>
            <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
              {visible.map((col) => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300">
                    <div
                      onDoubleClick={() => moveToHidden([colId])}
                      onClick={e => handleSelect(colId, selectedVisible, setSelectedVisible, e)}
                      className={`w-full py-1 px-2 cursor-pointer ${
                        selectedVisible.includes(colId) ? 'bg-blue-200' : ''
                      }`}
                    >
                      {String(col.header)}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>

            <div className="flex flex-wrap gap-1 mt-2 items-center justify-center">
              <Button title="Move Up" size="xs" onClick={() => move(selectedVisible, 'up')}>
                <ArrowUp />
              </Button>
              <Button title="Move Down" size="xs" onClick={() => move(selectedVisible, 'down')}>
                <ArrowDown />
              </Button>
              <Button title="Move to Top" size="xs" onClick={() => move(selectedVisible, 'top')}>
                <ArrowBigUp />
              </Button>
              <Button title="Move to Bottom" size="xs" onClick={() => move(selectedVisible, 'bottom')}>
                <ArrowBigDown />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center items-center gap-2">
            <Button
              title="Move to Do not Display"
              size="xs"
              onClick={() => moveToHidden(selectedVisible)}
            >
              <ArrowRight />
            </Button>
            <Button
              title="Move to Display"
              size="xs"
              onClick={() => moveToVisible(selectedHidden)}
            >
              <ArrowLeft />
            </Button>
            <Button
              title="Hide All"
              size="xs"
              onClick={() => moveToHidden(visible.map(getColumnId))}
            >
              <ArrowBigRight />
            </Button>
            <Button
              title="Show All"
              size="xs"
              onClick={() => moveToVisible(hidden.map(getColumnId))}
            >
              <ArrowBigLeft />
            </Button>
          </div>

          {/* Hidden Columns */}
          <div>
            <h3 className="font-bold mb-2">Do Not Display</h3>
            <ScrollArea className="border border-gray-600 rounded h-120 space-y-1">
              {filteredHidden.map((col) => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300">
                    <div
                      onDoubleClick={() => moveToVisible([colId])}
                      onClick={e => handleSelect(colId, selectedHidden, setSelectedHidden, e)}
                      className={`px-2 py-1 cursor-pointer rounded ${
                        selectedHidden.includes(colId) ? 'bg-green-200' : ''
                      }`}
                    >
                      {String(col.header)}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
            <Input
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end mt-4 gap-2">
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
