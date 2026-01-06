'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiMessageSquare, FiEye, FiPlus, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import {
  getMyInquiries,
  GENERAL_INQUIRY_TYPE_LABELS,
  GENERAL_INQUIRY_STATUS_LABELS,
  GENERAL_INQUIRY_STATUS_COLORS,
  type GeneralInquiryListItem,
} from '@/lib/api/inquiry'
import { showErrorToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'

export default function MyInquiriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [inquiries, setInquiries] = useState<GeneralInquiryListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchInquiries()
  }, [user, currentPage])

  const fetchInquiries = async () => {
    setIsLoading(true)
    try {
      const result = await getMyInquiries({
        page: currentPage,
        size: 20,
        sort: 'createdAt,DESC',
      })

      if (result.success && result.data) {
        setInquiries(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '문의 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiMessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">내 문의 내역</h1>
                <p className="text-gray-600 mt-1">
                  총 <span className="font-bold text-primary">{totalElements}</span>개의 문의
                </p>
              </div>
            </div>
            <Link
              href="/inquiries"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              새 문의 작성
            </Link>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-primary font-medium">대기중</p>
                  <p className="text-2xl font-bold text-primary">
                    {inquiries.filter(i => i.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-yellow-700 font-medium">처리중</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {inquiries.filter(i => i.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">답변완료</p>
                  <p className="text-2xl font-bold text-green-900">
                    {inquiries.filter(i => i.status === 'ANSWERED').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">종료</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inquiries.filter(i => i.status === 'CLOSED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mb-4"></div>
            <p className="text-gray-600 text-lg">문의 목록을 불러오는 중...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">작성한 문의가 없습니다</h3>
            <p className="text-gray-600 mb-8">궁금하신 사항을 문의해주시면 빠르게 답변드리겠습니다</p>
            <Link
              href="/inquiries"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              문의하기
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        문의 유형
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        답변여부
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        보기
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.uuid} className="hover:bg-primary-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/inquiries/my/${inquiry.uuid}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            {GENERAL_INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
                            {inquiry.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${GENERAL_INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                            {GENERAL_INQUIRY_STATUS_LABELS[inquiry.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inquiry.hasAnswer ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <FiCheckCircle className="w-4 h-4" />
                              <span className="text-sm font-semibold">답변완료</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">미답변</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/inquiries/my/${inquiry.uuid}`}
                            className="inline-flex items-center justify-center w-9 h-9 bg-primary-100 hover:bg-primary-200 text-primary rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FiEye className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  이전
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    const page = i
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg'
                            : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {page + 1}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
