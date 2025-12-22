'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiExternalLink, FiCalendar, FiRefreshCw } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import { adminGetPromotions, type PortfolioPromotion } from '@/lib/api/portfolio'
import { showErrorToast } from '@/lib/errorHandler'

export default function AdminPortfolioPromotionsPage() {
  const [promotions, setPromotions] = useState<PortfolioPromotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'EXPIRED' | 'CANCELLED' | undefined>('ACTIVE')

  const fetchPromotions = async () => {
    try {
      setIsLoading(true)
      const response = await adminGetPromotions(statusFilter)
      if (response.success && response.data) {
        setPromotions(response.data)
      }
    } catch (error) {
      showErrorToast(error, '우대 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [statusFilter])

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'PREMIUM':
        return { label: '강력우대', color: 'bg-yellow-100 text-yellow-800' }
      case 'STANDARD':
        return { label: '일반우대', color: 'bg-blue-100 text-blue-800' }
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: '활성', color: 'bg-green-100 text-green-800' }
      case 'EXPIRED':
        return { label: '만료', color: 'bg-gray-100 text-gray-800' }
      case 'CANCELLED':
        return { label: '취소됨', color: 'bg-red-100 text-red-800' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">포트폴리오 우대 관리</h1>
              <p className="text-gray-600 mt-1">우대등록 중인 포트폴리오 목록</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/portfolio-promotions/settings"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              우대 타입 설정
            </Link>
            <button
              onClick={fetchPromotions}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-2 mb-6">
          {(['ACTIVE', 'EXPIRED', 'CANCELLED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getStatusLabel(status).label}
            </button>
          ))}
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === undefined
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">우대 포트폴리오가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">포트폴리오</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">우대 타입</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">가중치</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">월 가격</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">기간</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">자동갱신</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promotions.map((promo) => {
                    const typeInfo = getPromotionTypeLabel(promo.promotionType)
                    const statusInfo = getStatusLabel(promo.status)

                    return (
                      <tr key={promo.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">
                              {promo.portfolioTitle}
                            </span>
                            <Link
                              href={`/portfolios/${promo.portfolioUuid}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FiExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                          {promo.weight}x
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {promo.monthlyPrice.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          <div className="flex items-center justify-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            <span>{promo.startDate} ~ {promo.endDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            promo.autoRenew
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {promo.autoRenew ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 통계 요약 */}
        {promotions.length > 0 && statusFilter === 'ACTIVE' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">총 활성 우대</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.length}건</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">PREMIUM 우대</p>
              <p className="text-2xl font-bold text-yellow-600">
                {promotions.filter(p => p.promotionType === 'PREMIUM').length}건
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">STANDARD 우대</p>
              <p className="text-2xl font-bold text-blue-600">
                {promotions.filter(p => p.promotionType === 'STANDARD').length}건
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">예상 월 수익</p>
              <p className="text-2xl font-bold text-green-600">
                {promotions.reduce((sum, p) => sum + p.monthlyPrice, 0).toLocaleString()}원
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
