'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  getMyPlannerApplications,
  STATUS_LABELS,
  STATUS_COLORS,
  CONSULTATION_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type PlannerApplicationStatus,
  type PlannerApplicationListResponse,
  type PageResponse,
} from '@/lib/api/planner'
import { showErrorToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function MyPlannerApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<PageResponse<PlannerApplicationListResponse> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PlannerApplicationStatus | ''>('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/planner/my')
    }
  }, [user, router])

  const fetchApplications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const params: { status?: PlannerApplicationStatus; page: number; size: number } = {
        page,
        size: 10,
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      const response = await getMyPlannerApplications(params)
      if (response.success) {
        setApplications(response.data)
      }
    } catch (error) {
      showErrorToast(error, '신청서 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user, statusFilter, page])

  const handleStatusFilterChange = (status: PlannerApplicationStatus | '') => {
    setStatusFilter(status)
    setPage(0)
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">내 상담 신청 내역</h1>
              <p className="text-gray-600 mt-1">내가 신청한 플래너 상담 내역을 확인하세요.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/planner"
                className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                전체 신청현황
              </Link>
              <Link
                href="/planner/create"
                className="inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 상담 신청
              </Link>
            </div>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilterChange('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {(Object.keys(STATUS_LABELS) as PlannerApplicationStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilterChange(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : applications?.content.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">신청 내역이 없습니다.</p>
              <Link
                href="/planner/create"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 상담 신청하기
              </Link>
            </div>
          ) : (
            <>
              {/* 모바일 카드 뷰 */}
              <div className="md:hidden divide-y divide-gray-200">
                {applications?.content.map((app) => (
                  <Link
                    key={app.uuid}
                    href={`/planner/my/${app.uuid}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 line-clamp-1 flex-1 mr-2">{app.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {app.requestTypes.slice(0, 2).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {REQUEST_TYPE_LABELS[type]}
                        </span>
                      ))}
                      {app.requestTypes.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{app.requestTypes.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{CONSULTATION_METHOD_LABELS[app.consultationMethod]}</span>
                      <span>{new Date(app.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상담방법</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">요청내용</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">신청일</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications?.content.map((app) => (
                      <tr key={app.uuid} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/planner/my/${app.uuid}`}
                            className="text-gray-900 hover:text-blue-600 font-medium"
                          >
                            <div className="max-w-xs truncate">{app.title}</div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CONSULTATION_METHOD_LABELS[app.consultationMethod]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {app.requestTypes.slice(0, 2).map((type) => (
                              <span
                                key={type}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {REQUEST_TYPE_LABELS[type]}
                              </span>
                            ))}
                            {app.requestTypes.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{app.requestTypes.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                            {STATUS_LABELS[app.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/planner/my/${app.uuid}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            상세보기
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* 페이지네이션 */}
        {applications && applications.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={applications.first}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {applications.number + 1} / {applications.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={applications.last}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
