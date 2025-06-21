'use client'

import { useAppDispatch } from '@/hooks/useRedux';
import { hideLoader } from '@/store/fullPageLoaderSlice';
import { Card, CardContent } from '@/components/ui/card'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { Users, MapPin, Layers3, Route, LayoutGrid, User, Rows } from 'lucide-react'
import CountBox from '@/components/custom/CountUp'
import PieChart from '@/components/custom/PieChart'
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend)

const countData = [
  { label: 'Zones', count: 12, icon: <MapPin size={48} className="text-blue-500" /> },
  { label: 'Allotments', count: 24, icon: <Layers3 size={48} className="text-green-500" /> },
  { label: 'Slots', count: 50, icon: <LayoutGrid size={48} className="text-orange-500" /> },
  { label: 'Routes', count: 18, icon: <Route size={48} className="text-purple-500" /> },
  { label: 'Users', count: 150, icon: <Users size={48} className="text-orange-500" /> },
]

const barChartData = {
  labels: ['Zones', 'Allotments', 'Slots', 'Routes', 'Users'],
  datasets: [
    {
      label: 'Modules',
      data: [12, 24, 50, 18, 150],
      backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'],
    },
  ],
}

const pieChartData = {
  labels: ['Zones', 'Allotments', 'Slots', 'Routes', 'Users'],
  height: 100,
  width: 100,
  datasets: [
    {
      label: 'Distribution',
      data: [12, 24, 50, 18, 150],
      backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'],
      borderWidth: 1,
    },
  ],
}

const lineChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      label: 'User Growth',
      data: [50, 60, 80, 100, 150],
      fill: false,
      borderColor: '#ec4899',
      tension: 0.3,
    },
  ],
}

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(hideLoader());
  }, [dispatch]);
    const items = [
        {
          title: 'Zones',
          count: 23,
          icon: <MapPin size={60} />,
          gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        },
        {
          title: 'Allotments',
          count: 58,
          icon: <LayoutGrid size={60} />,
          gradient: 'bg-gradient-to-br from-emerald-400 to-green-600',
        },
        {
          title: 'Slots',
          count: 147,
          icon: <Rows size={60} />,
          gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500',
        },
        {
          title: 'Routes',
          count: 32,
          icon: <Route size={60} />,
          gradient: 'bg-gradient-to-br from-orange-400 to-rose-500',
        }
      ]
    
  return (
    <div className="w-full p-0 mt-[-20px] bg-gradient-to-br from-white-100 via-sky-100 to-orange-100 space-y-8 rounded-3xl">
      {/* Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 p-6 pt-6 px-2">
      {items.map((item, index) => (
        <CountBox key={index} {...item} />
      ))}
    </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2"
      >
        <Card className="rounded-2xl shadow-md max-h-[400px] lg:max-h-[600px] bg-gradient-to-br from-white-100 via-white-100 to-orange-100">
          <CardContent className="p-4 cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">Module Distribution (Bar)</h2>
            <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md max-h-[400px] lg:max-h-[600px] bg-gradient-to-br from-white-100 via-white-100 to-orange-100">
          <CardContent className="p-4 cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">Module Breakdown (Pie)</h2>
            <PieChart
                labels={['Zones', 'Routes', 'Slots']}
                data={[10, 20, 30]}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-2xl shadow-md bg-gradient-to-br from-white-100 via-white-100 to-orange-100">
          <CardContent className="p-4 cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">User Growth (Line)</h2>
            <Line data={lineChartData} options={{ responsive: true }} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
