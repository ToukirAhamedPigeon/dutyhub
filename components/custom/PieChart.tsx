// components/dashboard/PieChart.tsx
'use client'

import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useTranslations } from 'next-intl';

ChartJS.register(ArcElement, Tooltip, Legend)

type PieChartProps = {
  labels: string[]
  data: number[]
  backgroundColors?: string[]
}

export default function PieChart({ labels, data, backgroundColors }: PieChartProps) {
  return (
    <div className='flex flex-col items-center justify-center'>
        <div className="w-[300px] h-[300px]">
            <Pie
                data={{
                labels,
                datasets: [
                    {
                    data,
                    backgroundColor:
                        backgroundColors ||
                        ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
                    borderWidth: 1,
                    },
                ],
                }}
                options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                    display: false,
                    },
                },
                }}
            />
            </div>
    </div>
  )
}
