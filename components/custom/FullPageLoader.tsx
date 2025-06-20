'use client'

import { useAppSelector } from '@/hooks/useRedux';
import { motion } from 'framer-motion'
import { CarIcon } from 'lucide-react'

const FullPageLoader = () => {
  const isLoading = useAppSelector((state) => state.fullPageLoader.isLoading);
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-black flex items-center justify-center z-50">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [20, -10, 20], opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center space-y-4"
      >
        <CarIcon className="w-20 h-20 text-blue-600 dark:text-white animate-pulse" />
        <motion.div
          className="text-lg font-semibold text-gray-600 dark:text-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Your data is loading...
        </motion.div>
      </motion.div>
    </div>
  )
}

export default FullPageLoader
