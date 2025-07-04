import { useState } from 'react'
import api from '@/lib/axios'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { authorizationHeader } from '@/lib/tokens';

type UseDeleteWithConfirmProps = {
  endpoint: string
  onSuccess?: () => void
}

export function useDeleteWithConfirm({ endpoint, onSuccess }: UseDeleteWithConfirmProps) {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const confirmDelete = (id: string) => {
    setItemToDelete(id)
    setDialogOpen(true)
  }

  const cancelDelete = () => {
    setItemToDelete(null)
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const headers = await authorizationHeader();
      const res = await api.delete(`${endpoint}/${itemToDelete}`, {headers})

      const { status, message } = res.data

      if (status === 'deleted') {
        toast.success('Deleted successfully')
      } else if (status === 'inactive') {
        toast.warning('Has activity, made inactive')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Delete error:', error)
      if (error instanceof AxiosError && error.response?.status === 403) {
        toast.warning(error.response.data.error || 'Item is not deletable')
      } else {
        toast.error('Error deleting item')
      }
    } finally {
      cancelDelete()
    }
  }

  return {
    dialogOpen,
    confirmDelete,
    cancelDelete,
    handleDelete,
  }
}
