'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getAdminCreditPackages,
  toggleCreditPackageActive,
  deleteCreditPackage,
  getCreditPackageStats,
  type AdminCreditPackage
} from '@/lib/api/admin-credit-package'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoAdd, IoCheckmarkCircle, IoCloseCircle, IoCash } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminCreditPackagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<AdminCreditPackage[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // 필터 상태
  const [filters, setFilters] = useState({
    unitAmount: searchParams.get('unitAmount') || '',
    isActive: searchParams.get('isActive') || '',
    page: parseInt(searchParams.get('page') || '0'),
  })

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken || user?.currentRole !== 'ADMIN') {
      showErrorToast(null, '관리자 권한이 필요합니다')
      router.push('/admin')
      return
    }
    setIsCheckingAuth(false)
  }, [accessToken, _hasHydrated, user, router])

  // 데이터 로드
  useEffect(() => {
    if (isCheckingAuth) return
    fetchData()
  }, [isCheckingAuth, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: filters.page,
        size: 20,
        sort: 'displayOrder,asc',
      }

      if (filters.unitAmount) {
        params.unitAmount = parseInt(filters.unitAmount)
      }

      if (filters.isActive) {
        params.isActive = filters.isActive === 'true'
      }

      const [packagesRes, statsRes] = await Promise.all([
        getAdminCreditPackages(params),
        getCreditPackageStats(),
      ])

      if (packagesRes.success && packagesRes.data) {
        setPackages(packagesRes.data.content)
        setTotalPages(packagesRes.data.totalPages)
        setTotalElements(packagesRes.data.totalElements)
      }

      if (statsRes.success && statsRes.data !== undefined) {
        setActiveCount(statsRes.data)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 필터 변경
  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value, page: 0 }
    setFilters(newFilters)

    const params = new URLSearchParams()
    if (newFilters.unitAmount) params.set('unitAmount', newFilters.unitAmount)
    if (newFilters.isActive) params.set('isActive', newFilters.isActive)
    params.set('page', '0')

    router.push(`/admin/credit-packages?${params.toString()}`)
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({ unitAmount: '', isActive: '', page: 0 })
    router.push('/admin/credit-packages')
  }

  // 활성화/비활성화 토글
  const handleToggleActive = async (pkg: AdminCreditPackage) => {
    const action = pkg.isActive ? '비활성화' : '활성화'
    if (!confirm(`${pkg.displayName}을(를) ${action}하시겠습니까?`)) {
      return
    }

    try {
      const result = await toggleCreditPackageActive(pkg.uuid)
      if (result.success) {
        showSuccessToast(`${action}되었습니다`)
        fetchData()
      } else {
        showErrorToast(null, result.message || `${action}에 실패했습니다`)
      }
    } catch (error) {
      showErrorToast(error, `${action}에 실패했습니다`)
    }
  }

  // 삭제
  const handleDelete = async (pkg: AdminCreditPackage) => {
    if (!confirm(`${pkg.displayName}을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const result = await deleteCreditPackage(pkg.uuid)
      if (result.success) {
        showSuccessToast('삭제되었습니다')
        fetchData()
      } else {
        showErrorToast(null, result.message || '삭제에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다')
    }
  }

  if (isCheckingAuth || loading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-[calc(100vh-64px-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-[calc(100vh-64px-200px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">크레딧 패키지 관리</h1>
              <p className="mt-2 text-sm text-gray-600">
                크레딧 충전 패키지를 생성하고 관리합니다
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/credit-packages/new')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <IoAdd className="text-xl" />
              새 패키지 생성
            </button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <IoCash className="text-3xl text-primary" />
                <div>
                  <p className="text-sm text-gray-600">전체 패키지</p>
                  <p className="text-2xl font-bold text-gray-900">{totalElements}개</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <IoCheckmarkCircle className="text-3xl text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">활성 패키지</p>
                  <p className="text-2xl font-bold text-green-900">{activeCount}개</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <IoCloseCircle className="text-3xl text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">비활성 패키지</p>
                  <p className="text-2xl font-bold text-red-900">{totalElements - activeCount}개</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">단위 금액</label>
              <select
                value={filters.unitAmount}
                onChange={(e) => handleFilterChange('unitAmount', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="10000">1만원</option>
                <option value="30000">3만원</option>
                <option value="50000">5만원</option>
                <option value="100000">10만원</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">활성 상태</label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 패키지 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {packages.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">패키지가 없습니다</p>
              <button
                onClick={() => router.push('/admin/credit-packages/new')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                첫 패키지 생성하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      패키지명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      단위 금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      보너스율
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최대 보너스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      활성 상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pkg.displayName}</div>
                          <div className="text-sm text-gray-500">{pkg.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {pkg.unitAmount.toLocaleString()}원
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pkg.bonusEligible ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {pkg.bonusRate}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pkg.maxBonus ? `${pkg.maxBonus.toLocaleString()}원` : '무제한'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pkg.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pkg.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-500">
                        {pkg.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/credit-packages/${pkg.uuid}/edit`)}
                            className="text-primary hover:text-primary"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleToggleActive(pkg)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            {pkg.isActive ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleDelete(pkg)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  총 {totalElements}개 | {filters.page + 1} / {totalPages} 페이지
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFilterChange('page', (filters.page - 1).toString())}
                    disabled={filters.page === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', (filters.page + 1).toString())}
                    disabled={filters.page >= totalPages - 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
