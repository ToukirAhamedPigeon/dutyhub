// hooks/useDetailModal.ts
import { useState } from 'react'
import api from '@/lib/axios'

export function useDetailModal<T>(endpoint: string) {
  const authUser = localStorage.getItem('authUser')
  const token = JSON.parse(authUser || '{}').token
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  const fetchDetail = async (id: string) => {
    try {
      const res = await api.get(`${endpoint}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log(res)
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
