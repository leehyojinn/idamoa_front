'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaFileAlt, FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/authStore'
import { useMyProposalsDashboard } from '@/hooks/useCompanyDashboard'
import { showErrorToast } from '@/lib/errorHandler'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: '제출됨', color: 'bg-blue-100 text-blue-700' },
  VIEWED: { label: '열람됨', color: 'bg-yellow-100 text-yellow-700' },
  SELECTED: { label: '선정됨', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '미선정', color: 'bg-gray-100 text-gray-700' },
}

export default function CompanyProposalsPage() {
  const router = useRouter()
  const { accessToken, _hasHydrated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [page, setPage] = useState(0)
  const size = 10

  const { data: proposalsResponse, isLoading } = useMyProposalsDashboard(page, size)
  const proposals = proposalsResponse?.data?.content || []
  const totalPages = proposalsResponse?.data?.totalPages || 0
  const totalElements = proposalsResponse?.data?.totalElements || 0

  useEffect(() => {
    if (!_hasHydrated) return
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요한 페이지입니다')
      router.push('/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router, accessToken, _hasHydrated])

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/mypage/company-dashboard')}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaFileAlt className="text-blue-500" />
                내 제안
              </h1>
              <p className="text-gray-600 mt-1">총 {totalElements}개</p>
            </div>
          </div>
          <Link
            href="/estimates"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FaExternalLinkAlt className="w-4 h-4" />
            견적 요청 둘러보기
          </Link>
        </div>

        {/* 제안 목록 */}
        {proposals.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        제안 제목
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                        견적 요청
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                        제안 금액
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                        상태
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                        제출일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {proposals.map((proposal: any) => {
                      const status = STATUS_LABELS[proposal.status] || {
                        label: proposal.status,
                        color: 'bg-gray-100 text-gray-700',
                      }
                      return (
                        <tr
                          key={proposal.uuid}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/proposals/${proposal.uuid}`)}
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 truncate max-w-xs">
                              {proposal.title}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {proposal.requestTitle}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-primary">
                              {proposal.price?.toLocaleString()}원
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-500">
                            {formatDate(proposal.createdAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FaFileAlt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">제출한 제안이 없습니다</p>
            <Link
              href="/estimates"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FaExternalLinkAlt className="w-4 h-4" />
              견적 요청 둘러보기
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
