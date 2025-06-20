// components/dashboard/CountBox.tsx
'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'

type CountBoxProps = {
  title: string
  count: number
  icon: React.ReactNode
  gradient: string
}

export default function CountBox({ title, count, icon, gradient }: CountBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'rounded-2xl p-6 text-white shadow-xl w-full h-full flex flex-col justify-between',
        gradient
      )}
    >
        <div className='flex flex-row items-center justify-between'>
            <div className='flex flex-col items-start justify-start'>
                <div className="text-4xl mb-4">{icon}</div>
            </div>
            <div className='flex flex-col items-end justify-end'>
                <div className="text-4xl font-semibold">
                    <CountUp end={count} duration={2} separator="," />
                </div>
                <div className="mt-2 text-lg">{title}</div>
            </div>
        </div>
    </motion.div>
  )
}
