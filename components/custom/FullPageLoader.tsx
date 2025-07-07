'use client'

import { useAppSelector } from '@/hooks/useRedux';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useTranslations } from 'next-intl';

const FullPageLoader = () => {
  const { isLoading, message, icon } = useAppSelector((state) => state.fullPageLoader);
  const t = useTranslations();

  if (!isLoading) return null;

  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.DownloadCloud;

  return (
    <div className="fixed inset-0 secondary-link-gradient flex flex-col items-center justify-center z-50">
      {/* Initial entry animation for icon and message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center space-y-4"
      >
        <IconComponent className="w-28 h-28 text-white" />
        <div className="text-2xl font-semibold text-white text-center">
          {t(message) + '...'}
        </div>
      </motion.div>

      {/* Animated loading indicator */}
      <div className="flex space-x-2 mt-8">
        {['delay-0', 'delay-200', 'delay-400'].map((delay, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full bg-white animate-bounce ${delay}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FullPageLoader;
