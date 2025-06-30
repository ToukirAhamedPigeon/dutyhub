import { useState } from 'react'
import api from '@/lib/axios'
import { authorizationHeader } from '@/lib/tokens'

export function useDetailModal<T>(endpoint: string) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchDetail = async (id: string) => {
    setIsModalOpen(true) // Open immediately
    setDetailLoading(true)      // Show loading state
    try {
      const headers = await authorizationHeader()
      const res = await api.get(`${endpoint}/${id}`, { headers })
      setSelectedItem(res.data)
    } catch (error) {
      console.error('Error fetching detail:', error)
    } finally {
      setDetailLoading(false)   // Done loading
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
    detailLoading,
  }
}
