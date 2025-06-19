'use client'

import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5c400] to-[#bc6d00]">
      <div className="text-center text-white space-y-4">
        {/* 401 tada animation */}
        <motion.h1
          className="text-[100px] font-bold"
          initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
            duration: 0.6,
          }}
        >
          401
        </motion.h1>

        {/* Text block: fadeInDown */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="font-bold text-2xl">Unauthorized Access</p>
          <p className="mt-2">You don’t have permission to view this page.</p>
        </motion.div>

        {/* Go Back Button: slide up */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-white text-[#e56700] font-semibold rounded hover:bg-gray-100 transition"
          >
            Go Back
          </Button>
        </motion.div>

        {/* Footer: slow fade-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <Footer
            footerClasses="bottom-0 py-4 text-center text-xs text-slate-200 overflow-hidden mt-80"
            linkClasses="text-white hover:underline"
            showVersion={false}
          />
        </motion.div>
      </div>
    </div>
  )
}
