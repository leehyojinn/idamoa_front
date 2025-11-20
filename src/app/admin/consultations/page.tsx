'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiClock, FiUser, FiMessageSquare, FiEdit, FiTrash2 } from 'react-icons/fi'
import { adminGetConsultations, adminGetConsultationsByStatus, adminDeleteConsultation } from '@/lib/api/consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { ConsultationListItem, ConsultationStatus } from '@/types/consultation'

const STATUS_LABELS = {
  SUBMITTED: '접수됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
}

const STATUS_COLORS = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function AdminConsultationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [consultations, setConsultations] = useState<ConsultationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<ConsultationStatus | ''>('')

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '0')
    const status = (searchParams.get('status') as ConsultationStatus) || ''

    setCurrentPage(page)
    setSelectedStatus(status)
    fetchConsultations(page, status)
  }, [searchParams])

  const fetchConsultations = async (page: number = 0, status: ConsultationStatus | '' = '') => {
    setIsLoading(true)
    try {
      let result

      if (status) {
        result = await adminGetConsultationsByStatus(status, {
          page,
          size: 20,
        })
      } else {
        result = await adminGetConsultations({
          page,
          size: 20,
        })
      }

      if (result.success && result.data) {
        setConsultations(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '상담 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (status: ConsultationStatus | '') => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', '0')
    router.push(`/admin/consultations?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (selectedStatus) params.set('status', selectedStatus)
    router.push(`/admin/consultations?${params.toString()}`)
  }

  const handleDelete = async (uuid: string, name: string) => {
    if (!confirm(`정말로 "${name}"의 상담을 삭제하시겠습니까?`)) return

    try {
      await adminDeleteConsultation(uuid)
      showSuccessToast('상담이 삭제되었습니다')
      fetchConsultations(currentPage, selectedStatus)
    } catch (error) {
      showErrorToast(error, '상담 삭제에 실패했습니다')
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">빠른상담 관리</h1>
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{totalElements}</span>개의 상담
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleStatusChange('SUBMITTED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'SUBMITTED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            접수됨
          </button>
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            진행중
          </button>
          <button
            onClick={() => handleStatusChange('COMPLETED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'COMPLETED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            완료
          </button>
          <button
            onClick={() => handleStatusChange('CANCELLED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'CANCELLED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            취소
          </button>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">상담 목록을 불러오는 중...</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">등록된 상담이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상담 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr key={consultation.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/consultations/${consultation.uuid}`}
                        className="block hover:text-blue-600"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.subject || '상담 문의'}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {consultation.messagePreview}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{consultation.name}</div>
                      <div className="text-sm text-gray-500">{consultation.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[consultation.status]}`}>
                        {STATUS_LABELS[consultation.status]}
                      </span>
                      {consultation.hasResponse && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          답변완료
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(consultation.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/consultations/${consultation.uuid}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(consultation.uuid, consultation.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(Math.max(totalPages, 1), 10) }, (_, i) => {
                const page = i
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        </>
      )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
