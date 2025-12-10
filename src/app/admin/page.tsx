'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiCheckSquare,
  FiMessageSquare,
  FiPhoneCall,
  FiClipboard,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
} from 'react-icons/fi'
import { IoCash } from 'react-icons/io5'
import { getDashboardOverview, type DashboardOverview } from '@/lib/api/dashboard'
import { showErrorToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  link?: string
  color: string
}

function StatCard({ title, value, subtitle, icon, trend, link, color }: StatCardProps) {
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${link ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  )

  return link ? <Link href={link}>{card}</Link> : card
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOverview = async () => {
    setIsLoading(true)
    try {
      const result = await getDashboardOverview()
      if (result.success && result.data) {
        setOverview(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      showErrorToast(error, '대시보드 데이터를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const handleRefresh = () => {
    fetchOverview()
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">대시보드를 불러오는 중...</p>
            </div>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!overview) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-20">
            <p className="text-gray-500">대시보드 데이터를 불러올 수 없습니다</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600 mt-2">
              마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 회원 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">회원 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="전체 회원"
              value={overview.totalUsers}
              subtitle="등록된 전체 회원 수"
              icon={<FiUsers className="w-6 h-6 text-white" />}
              color="bg-blue-500"
              link="/admin/users"
            />
            <StatCard
              title="활성 회원"
              value={overview.activeUsers}
              subtitle={`${((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}% 활성`}
              icon={<FiUsers className="w-6 h-6 text-white" />}
              color="bg-green-500"
              link="/admin/users"
            />
            <StatCard
              title="오늘 신규 가입"
              value={overview.newUsersToday}
              subtitle="오늘 가입한 회원"
              icon={<FiTrendingUp className="w-6 h-6 text-white" />}
              color="bg-purple-500"
              link="/admin/users"
            />
            <StatCard
              title="이번 달 신규 가입"
              value={overview.newUsersThisMonth}
              subtitle="이번 달 가입한 회원"
              icon={<FiTrendingUp className="w-6 h-6 text-white" />}
              color="bg-indigo-500"
              link="/admin/users"
            />
          </div>
        </div>

        {/* 업체 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">업체 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="전체 업체"
              value={overview.totalCompanies}
              subtitle="등록된 전체 업체 수"
              icon={<FiBriefcase className="w-6 h-6 text-white" />}
              color="bg-orange-500"
              link="/admin/companies"
            />
            <StatCard
              title="활성 업체"
              value={overview.activeCompanies}
              subtitle={`${((overview.activeCompanies / overview.totalCompanies) * 100).toFixed(1)}% 활성`}
              icon={<FiBriefcase className="w-6 h-6 text-white" />}
              color="bg-yellow-500"
              link="/admin/companies"
            />
          </div>
        </div>

        {/* 견적/제안 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">견적 및 제안</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="전체 견적요청"
              value={overview.totalEstimateRequests}
              subtitle="등록된 전체 견적요청"
              icon={<FiFileText className="w-6 h-6 text-white" />}
              color="bg-teal-500"
              link="/admin/estimates"
            />
            <StatCard
              title="진행중인 견적요청"
              value={overview.estimateRequestsInProgress}
              subtitle="현재 진행중"
              icon={<FiFileText className="w-6 h-6 text-white" />}
              color="bg-cyan-500"
              link="/admin/estimates"
            />
            <StatCard
              title="전체 제안서"
              value={overview.totalProposals}
              subtitle="제출된 전체 제안서"
              icon={<FiCheckSquare className="w-6 h-6 text-white" />}
              color="bg-pink-500"
            />
            <StatCard
              title="제안서 선택률"
              value={`${overview.proposalSelectionRate.toFixed(1)}%`}
              subtitle="전체 제안서 대비"
              icon={<FiCheckSquare className="w-6 h-6 text-white" />}
              color="bg-rose-500"
            />
          </div>
        </div>

        {/* 상담 및 문의 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">상담 및 문의</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="대기중인 빠른상담"
              value={overview.pendingConsultations}
              subtitle="처리 대기중"
              icon={<FiPhoneCall className="w-6 h-6 text-white" />}
              color="bg-red-500"
              link="/admin/consultations"
            />
            <StatCard
              title="대기중인 플래너 신청"
              value={overview.pendingPlannerApplications}
              subtitle="검토 대기중"
              icon={<FiClipboard className="w-6 h-6 text-white" />}
              color="bg-amber-500"
              link="/admin/planner-applications"
            />
            <StatCard
              title="전체 문의"
              value={overview.totalInquiries}
              subtitle="접수된 전체 문의"
              icon={<FiMessageSquare className="w-6 h-6 text-white" />}
              color="bg-violet-500"
              link="/admin/general-inquiries"
            />
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">빠른 이동</h3>
              <div className="space-y-2">
                <Link
                  href="/admin/analytics"
                  className="block w-full py-2 px-4 text-center bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors text-sm border border-blue-200"
                >
                  상세 분석
                </Link>
                <Link
                  href="/admin/users"
                  className="block w-full py-2 px-4 text-center bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors text-sm border border-blue-200"
                >
                  회원 관리
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 크레딧 관리 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">크레딧 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <IoCash className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">패키지 관리</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                크레딧 충전 패키지를 생성하고 관리합니다
              </p>
              <div className="space-y-2">
                <Link
                  href="/admin/credit-packages"
                  className="block w-full py-2 px-4 text-center bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg font-medium transition-colors text-sm border border-emerald-200"
                >
                  패키지 목록
                </Link>
                <Link
                  href="/admin/credit-packages/new"
                  className="block w-full py-2 px-4 text-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  새 패키지 생성
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900">거래 내역</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                크레딧 충전 및 사용 내역을 조회합니다
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => showErrorToast(null, '준비 중입니다')}
                  className="block w-full py-2 px-4 text-center bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors text-sm border border-blue-200"
                >
                  전체 거래 내역
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-purple-900">통계</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">
                크레딧 충전 및 사용 통계를 확인합니다
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => showErrorToast(null, '준비 중입니다')}
                  className="block w-full py-2 px-4 text-center bg-white hover:bg-purple-50 text-purple-700 rounded-lg font-medium transition-colors text-sm border border-purple-200"
                >
                  통계 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
