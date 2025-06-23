'use client'

import { useAppSelector } from '@/hooks/useRedux';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';

const FullPageLoader = () => {
  const { isLoading, message, icon } = useAppSelector((state) => state.fullPageLoader);
  const t = useTranslations('Common');

  if (!isLoading) return null;

  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.DownloadCloudIcon;

  return (
    <div className="fixed inset-0 secondary-link-gradient flex items-center justify-center z-50">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [20, -10, 20], opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center space-y-4"
      >
        <IconComponent className="w-40 h-40 text-white animate-pulse" />
        <motion.div
          className="text-2xl font-semibold text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {t(message) + '...'}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FullPageLoader;
