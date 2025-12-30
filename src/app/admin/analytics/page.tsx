'use client'

import { useState, useEffect, useRef } from 'react'
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
import {
  Users,
  Eye,
  MousePointerClick,
  Clock,
  TrendingUp,
} from 'lucide-react'
import {
  getDailyTraffic,
  getPageViews,
  getRealtimeUsers,
  getSummaryStats,
  getDeviceStats,
  getLocationStats,
  getAcquisitionChannels,
  type DailyTrafficData,
  type PageViewData,
  type DeviceStatsData,
  type LocationStatsData,
  type AcquisitionChannelData,
  type SummaryStatsData,
} from '@/lib/api/analytics'
import { showErrorToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

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

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [realtimeUsers, setRealtimeUsers] = useState(0)
  const [summaryStats, setSummaryStats] = useState<SummaryStatsData | null>(null)
  const [dailyTrafficData, setDailyTrafficData] = useState<DailyTrafficData[]>([])
  const [pageViewsData, setPageViewsData] = useState<PageViewData[]>([])
  const [deviceStatsData, setDeviceStatsData] = useState<DeviceStatsData[]>([])
  const [locationStatsData, setLocationStatsData] = useState<LocationStatsData[]>([])
  const [acquisitionChannelsData, setAcquisitionChannelsData] = useState<AcquisitionChannelData[]>([])

  // Date range
  const [startDate, setStartDate] = useState(getLastWeekDate())
  const [endDate, setEndDate] = useState(getTodayDate())

  function getLastWeekDate(): string {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return formatDate(date)
  }

  function getTodayDate(): string {
    return formatDate(new Date())
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    loadAllData()
    loadRealtimeUsers()

    // Refresh realtime users every 30 seconds
    const interval = setInterval(() => loadRealtimeUsers(), 30000)
    return () => clearInterval(interval)
  }, [startDate, endDate])

  const loadAllData = async () => {
    if (!startDate || !endDate) return

    setIsLoading(true)

    try {
      // Load summary stats
      const summaryResponse = await getSummaryStats({
        startDateStr: startDate,
        endDateStr: endDate,
      })
      if (summaryResponse.success && summaryResponse.data) {
        setSummaryStats(summaryResponse.data)
      }

      // Load daily traffic
      const trafficResponse = await getDailyTraffic({
        startDateStr: startDate,
        endDateStr: endDate,
      })
      if (trafficResponse.success && trafficResponse.data) {
        setDailyTrafficData(trafficResponse.data)
      }

      // Load page views
      const pageViewsResponse = await getPageViews({
        startDateStr: startDate,
        endDateStr: endDate,
        limit: 10,
      })
      if (pageViewsResponse.success && pageViewsResponse.data) {
        setPageViewsData(pageViewsResponse.data)
      }

      // Load device stats
      const deviceResponse = await getDeviceStats({
        startDateStr: startDate,
        endDateStr: endDate,
      })
      if (deviceResponse.success && deviceResponse.data) {
        setDeviceStatsData(deviceResponse.data)
      }

      // Load location stats
      const locationResponse = await getLocationStats({
        startDateStr: startDate,
        endDateStr: endDate,
        limit: 10,
      })
      if (locationResponse.success && locationResponse.data) {
        setLocationStatsData(locationResponse.data)
      }

      // Load acquisition channels
      const acquisitionResponse = await getAcquisitionChannels({
        startDateStr: startDate,
        endDateStr: endDate,
        limit: 10,
      })
      if (acquisitionResponse.success && acquisitionResponse.data) {
        setAcquisitionChannelsData(acquisitionResponse.data)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRealtimeUsers = async () => {
    try {
      const response = await getRealtimeUsers()
      if (response.success && response.data) {
        setRealtimeUsers(response.data.activeUsers)
      }
    } catch (error) {
      console.error('Failed to load realtime users:', error)
    }
  }

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadAllData()
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0'
    return num.toLocaleString()
  }

  const formatPercentage = (num: number | undefined): string => {
    if (num === undefined) return '0%'
    return `${num.toFixed(1)}%`
  }

  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined) return '0s'
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

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
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics 대시보드</h1>
          <p className="text-gray-600">Google Analytics 통계를 확인하세요</p>
        </div>

        {/* 날짜 범위 선택 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 mb-6">
          <form onSubmit={handleDateRangeSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              조회
            </button>
          </form>
        </div>

        {/* 실시간 사용자 */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-lg mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">실시간 활성 사용자</p>
              <p className="text-4xl font-bold mt-2">{realtimeUsers}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* 요약 통계 카드 */}
        {summaryStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* 활성 사용자 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">활성 사용자</p>
                    <p className="text-2xl font-bold">{formatNumber(summaryStats.activeUsers)}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* 세션 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">세션</p>
                    <p className="text-2xl font-bold">{formatNumber(summaryStats.sessions)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <MousePointerClick className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* 페이지뷰 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">페이지뷰</p>
                    <p className="text-2xl font-bold">{formatNumber(summaryStats.screenPageViews)}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* 평균 세션 시간 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">평균 세션 시간</p>
                    <p className="text-2xl font-bold">{formatDuration(summaryStats.avgSessionDuration)}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* 이탈률 & 참여율 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <p className="text-sm text-gray-600 mb-2">이탈률</p>
                <p className="text-3xl font-bold">{formatPercentage(summaryStats.bounceRate)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${summaryStats.bounceRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                <p className="text-sm text-gray-600 mb-2">참여율</p>
                <p className="text-3xl font-bold">{formatPercentage(summaryStats.engagementRate)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${summaryStats.engagementRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 차트 */}
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

        {/* 페이지별 조회수 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 mb-6">
          <h2 className="text-xl font-bold mb-4">페이지별 조회수 (상위 10개)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    페이지 경로
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    페이지 제목
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    페이지뷰
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 체류 시간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageViewsData.length > 0 ? (
                  pageViewsData.map((page, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{page.pagePath}</td>
                      <td className="px-6 py-4 text-sm">{page.pageTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatNumber(page.screenPageViews)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatDuration(page.avgSessionDuration)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 획득 채널 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 mb-6">
          <h2 className="text-xl font-bold mb-4">사용자 획득 채널 (상위 10개)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소스</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매체</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">세션</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">신규 사용자</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">참여율</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {acquisitionChannelsData.length > 0 ? (
                  acquisitionChannelsData.map((channel, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{channel.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{channel.medium}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatNumber(channel.sessions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatNumber(channel.newUsers)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatPercentage(channel.engagementRate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 지역별 통계 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 mb-6">
          <h2 className="text-xl font-bold mb-4">지역별 통계 (상위 10개)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">국가</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">도시</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">세션</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationStatsData.length > 0 ? (
                  locationStatsData.map((location, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{location.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{location.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatNumber(location.sessions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatNumber(location.users)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <span>데이터를 불러오는 중...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
