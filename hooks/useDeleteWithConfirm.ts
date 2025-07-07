import { useState } from 'react'
import api from '@/lib/axios'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { authorizationHeader } from '@/lib/tokens';
import { useTranslations } from 'next-intl';

type UseDeleteWithConfirmProps = {
  endpoint: string
  onSuccess?: () => void
}

export function useDeleteWithConfirm({ endpoint, onSuccess }: UseDeleteWithConfirmProps) {
  const t = useTranslations();
  const [deleteLoading, setDeleteLoading] = useState(false)
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
    setDeleteLoading(true) // start loading
  
    try {
      const headers = await authorizationHeader()
      const res = await api.delete(`${endpoint}/${itemToDelete}`, { headers })
  
      const { status, message } = res.data
  
      if (status === 'deleted') {
        toast.success(t(message), {
          style: {
            background: 'green',
            color: 'white',
          },
        })
      } else if (status === 'inactive') {
        toast.warning(t(message), {
          style: {
            background: 'orange',
            color: 'white',
          },
        })
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
      setDeleteLoading(false) // end loading
      cancelDelete()
    }
  }

  return {
    dialogOpen,
    confirmDelete,
    cancelDelete,
    handleDelete,
    deleteLoading,
  }
}
