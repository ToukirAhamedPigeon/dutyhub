'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (columns: any[]) => void
  visible: any[]
  hidden: any[]
  setVisible: (cols: any[]) => void
  setHidden: (cols: any[]) => void
  moveToHidden: (ids: string[]) => void
  moveToVisible: (ids: string[]) => void
  move: (ids: string[], dir: 'up' | 'down' | 'top' | 'bottom') => void
  reset: () => void
}

export default function ColumnSettingsModal({
  isOpen,
  onClose,
  onSave,
  visible,
  hidden,
  setVisible,
  setHidden,
  moveToHidden,
  moveToVisible,
  move,
  reset,
}: Props) {
  const [selectedVisible, setSelectedVisible] = useState<string[]>([])
  const [selectedHidden, setSelectedHidden] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filteredHidden = hidden.filter(col =>
    (col.header as string).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-bold mb-2">Display</h3>
            <ScrollArea className="border rounded h-64 p-2 space-y-1">
              {visible.map(col => (
                <div
                  key={col.id}
                  onDoubleClick={() => moveToHidden([col.id as string])}
                  onClick={() =>
                    setSelectedVisible(prev =>
                      prev.includes(col.id as string)
                        ? prev.filter(i => i !== col.id)
                        : [...prev, col.id as string]
                    )
                  }
                  className={`p-2 cursor-pointer rounded ${
                    selectedVisible.includes(col.id) ? 'bg-blue-200' : ''
                  }`}
                >
                  {col.header}
                </div>
              ))}
            </ScrollArea>
            <div className="flex flex-wrap gap-1 mt-2">
              <Button size="sm" onClick={() => move(selectedVisible, 'up')}>⬆️ Up</Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'down')}>⬇️ Down</Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'top')}>⏫ Top</Button>
              <Button size="sm" onClick={() => move(selectedVisible, 'bottom')}>⏬ Bottom</Button>
              <Button size="sm" variant="destructive" onClick={() => moveToHidden(selectedVisible)}>Hide</Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center items-center gap-2">
            <Button variant="outline" onClick={() => moveToHidden(visible.map(c => c.id as string))}>
              ⇨ Hide All
            </Button>
            <Button variant="outline" onClick={() => moveToVisible(hidden.map(c => c.id as string))}>
              ⇦ Show All
            </Button>
          </div>

          {/* Hidden Columns */}
          <div>
            <h3 className="font-bold mb-2">Do Not Display</h3>
            <Input
              placeholder="Search headers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="border rounded h-64 p-2 space-y-1">
              {filteredHidden.map(col => (
                <div
                  key={col.id}
                  onDoubleClick={() => moveToVisible([col.id as string])}
                  onClick={() =>
                    setSelectedHidden(prev =>
                      prev.includes(col.id as string)
                        ? prev.filter(i => i !== col.id)
                        : [...prev, col.id as string]
                    )
                  }
                  className={`p-2 cursor-pointer rounded ${
                    selectedHidden.includes(col.id) ? 'bg-green-200' : ''
                  }`}
                >
                  {col.header}
                </div>
              ))}
            </ScrollArea>
            <Button size="sm" className="mt-2" onClick={() => moveToVisible(selectedHidden)}>Show Selected</Button>
          </div>
        </div>

        <DialogFooter className="flex justify-end mt-4 gap-2">
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => {
            onSave(visible)
            onClose()
          }}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
