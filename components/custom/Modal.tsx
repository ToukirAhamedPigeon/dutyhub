import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  titleClassName?: string
  bgColor?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, titleClassName, bgColor="white" }) => {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pt-[50px] flex items-start justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={cn("relative p-8 rounded-lg w-full max-w-3xl max-h-[calc(100vh-100px)] overflow-y-auto", (bgColor=="transparent") ? "bg-transparent" : "bg-gradient-to-t from-[#fdfbfb] via-white to-[#ebedee]")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon (top right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <div className={cn("text-2xl font-semibold text-gray-800 mb-6", titleClassName)}>
          {title}
        </div>

        {children}
      </motion.div>
    </motion.div>
  )
}

export default Modal
