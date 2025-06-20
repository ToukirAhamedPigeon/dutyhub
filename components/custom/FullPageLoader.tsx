'use client'

import { useAppSelector } from '@/hooks/useRedux';
import { motion } from 'framer-motion'
import { CarIcon, DownloadCloudIcon } from 'lucide-react'

const FullPageLoader = () => {
  const isLoading = useAppSelector((state) => state.fullPageLoader.isLoading);
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 secondary-link-gradient flex items-center justify-center z-50">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [20, -10, 20], opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center space-y-4"
      >
        <DownloadCloudIcon className="w-40 h-40 text-white  animate-pulse" />
        <motion.div
          className="text-2xl font-semibold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Welcome to Duty Hub — Preparing your workspace...
        </motion.div>
      </motion.div>
    </div>
  )
}

export default FullPageLoader
