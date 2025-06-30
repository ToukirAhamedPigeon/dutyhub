'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  bgColor?: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  titleClassName,
  bgColor = 'white',
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pt-[50px] flex items-start justify-center bg-black/50 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative rounded-md border border-gray-300 shadow-2xl w-full max-w-3xl max-h-[calc(100vh-100px)] bg-white overflow-hidden',
          bgColor === 'transparent'
            ? 'bg-transparent'
            : 'bg-gradient-to-t from-[#fdfbfb] via-white to-[#ebedee]'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }} // enable flex column for sticky header + scrollable body
      >
        {/* Sticky Header */}
        <div
          className={cn(
            'sticky top-0 z-10 bg-white border-b border-gray-300 flex items-center justify-between px-6 py-4',
            titleClassName
          )}
        >
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Close modal"
          >
            <X className='cursor-pointer' size={24} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ flexGrow: 1, maxHeight: 'calc(100vh - 150px)' }} // fill remaining height & scroll inside
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Modal;
