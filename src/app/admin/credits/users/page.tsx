'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAdminUserCredits, type AdminUserCredit } from '@/lib/api/admin-credit'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoSearch, IoAdd, IoRemove, IoEye, IoCash } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminUserCreditsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<AdminUserCredit[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0'))

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
  }, [isCheckingAuth, page, searchParams])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        size: 20,
        sort: 'availableCredits,desc',
      }

      const keywordParam = searchParams.get('keyword')
      if (keywordParam) {
        params.keyword = keywordParam
      }

      const result = await getAdminUserCredits(params)

      if (result.success && result.data) {
        setCredits(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    }
    params.set('page', '0')
    router.push(`/admin/credits/users?${params.toString()}`)
  }

  // 검색 초기화
  const handleClear = () => {
    setKeyword('')
    router.push('/admin/credits/users')
  }

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/admin/credits/users?${params.toString()}`)
  }

  if (isCheckingAuth || loading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">사용자 크레딧 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            모든 사용자의 크레딧을 조회하고 관리합니다
          </p>
        </div>

        {/* 통계 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <IoCash className="text-3xl text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">총 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements.toLocaleString()}명</p>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="이메일 또는 이름으로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              검색
            </button>
            {keyword && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                초기화
              </button>
            )}
          </form>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {credits.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가용 크레딧
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 적립
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 사용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {credits.map((credit) => (
                    <tr key={credit.creditUuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{credit.userEmail}</div>
                          <div className="text-sm text-gray-500">UUID: {credit.userUuid.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-blue-600">
                          {credit.availableCredits.toLocaleString()}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          +{credit.totalEarned.toLocaleString()}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-red-600">
                          -{credit.totalSpent.toLocaleString()}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(credit.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/credits/users/${credit.userUuid}`)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <IoEye />
                            상세
                          </button>
                          <button
                            onClick={() => router.push(`/admin/credits/users/${credit.userUuid}/grant`)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <IoAdd />
                            지급
                          </button>
                          <button
                            onClick={() => router.push(`/admin/credits/users/${credit.userUuid}/deduct`)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <IoRemove />
                            차감
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
                  총 {totalElements}명 | {page + 1} / {totalPages} 페이지
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages - 1}
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
