'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import type { DailyTrafficData, DeviceStatsData } from '@/lib/api/analytics'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AnalyticsChartsProps {
  dailyTrafficData: DailyTrafficData[]
  deviceStatsData: DeviceStatsData[]
}

export default function AnalyticsCharts({
  dailyTrafficData,
  deviceStatsData,
}: AnalyticsChartsProps) {
  // Traffic chart data
  const trafficChartData = {
    labels: dailyTrafficData.map((d) => d.date),
    datasets: [
      {
        label: '활성 사용자',
        data: dailyTrafficData.map((d) => d.activeUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: '세션',
        data: dailyTrafficData.map((d) => d.sessions),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: '페이지뷰',
        data: dailyTrafficData.map((d) => d.screenPageViews),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const trafficChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '일별 트래픽',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  // Device chart data
  const deviceChartData = {
    labels: deviceStatsData.map((d) => d.deviceCategory),
    datasets: [
      {
        label: '세션',
        data: deviceStatsData.map((d) => d.sessions),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(249, 115, 22)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const deviceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: '기기별 세션',
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 일별 트래픽 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
        <div className="h-80">
          <Line data={trafficChartData} options={trafficChartOptions} />
        </div>
      </div>

      {/* 기기별 통계 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
        <div className="h-80">
          <Doughnut data={deviceChartData} options={deviceChartOptions} />
        </div>
      </div>
    </div>
  )
}
