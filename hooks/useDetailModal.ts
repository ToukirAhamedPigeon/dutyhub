import { useState } from 'react';
import api from '@/lib/axios';
import { authorizationHeader } from '@/lib/tokens';
import { ObjectId } from 'mongoose';


export function useDetailModal<T extends { _id: string | ObjectId }>(endpoint: string) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchDetail = async (itemOrId: T | string) => {
    setIsModalOpen(true);
  
    if (typeof itemOrId === 'object' && itemOrId !== null) {
      // If a full object is passed, use it directly
      setSelectedItem(itemOrId);
      return;
    }
  
    // Otherwise treat it as an ID string and fetch data from API
    setDetailLoading(true);
    try {
      const headers = await authorizationHeader();
      const res = await api.get(`${endpoint}/${itemOrId}`, { headers });
      setSelectedItem(res.data);
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading,
  };
}

