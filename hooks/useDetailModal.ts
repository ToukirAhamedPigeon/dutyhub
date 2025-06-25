// hooks/useDetailModal.ts
import { useState } from 'react'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens';

export function useDetailModal<T>(endpoint: string) {
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const fetchDetail = async (id: string) => {
    try {
      const headers = await authorizationHeader();
      const res = await api.get(`${endpoint}/${id}`, {
        headers
      })
      setSelectedItem(res.data)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching detail:', error)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  return {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
  }
}
