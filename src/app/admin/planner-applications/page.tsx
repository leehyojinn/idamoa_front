'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  adminGetPlannerApplications,
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

export default function AdminPlannerApplicationsPage() {
  const [applications, setApplications] = useState<PageResponse<PlannerApplicationListResponse> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PlannerApplicationStatus | ''>('')
  const [page, setPage] = useState(0)

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const params: { status?: PlannerApplicationStatus; page: number; size: number } = {
        page,
        size: 20,
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      const response = await adminGetPlannerApplications(params)
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
    fetchApplications()
  }, [statusFilter, page])

  const handleStatusFilterChange = (status: PlannerApplicationStatus | '') => {
    setStatusFilter(status)
    setPage(0)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">플래너 신청서 관리</h1>
          <p className="text-gray-600 mt-1">플래너 상담 신청서를 관리합니다.</p>
        </div>

      {/* 상태 필터 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilterChange('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-primary text-white'
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
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : applications?.content.length === 0 ? (
          <div className="p-8 text-center text-gray-500">신청서가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">신청자</th>
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
                      <div className="max-w-xs truncate font-medium text-gray-900">{app.title}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{app.applicantName}</td>
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
                        href={`/admin/planner-applications/${app.uuid}`}
                        className="text-primary hover:text-primary font-medium text-sm"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
