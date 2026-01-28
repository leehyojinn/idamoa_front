'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiSearch, FiEye, FiTrash2, FiRotateCcw, FiPhone, FiMail, FiMessageCircle } from 'react-icons/fi'
import {
  getAdminPortfolioConsultations,
  updateAdminConsultationStatus,
  deleteAdminPortfolioConsultation,
  restoreAdminPortfolioConsultation,
  STATUS_LABELS,
  STATUS_BADGE_STYLES,
  CONTACT_METHOD_LABELS,
  type PortfolioConsultation,
  type PortfolioConsultationStatus,
} from '@/lib/api/admin-portfolio-consultation'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

const STATUS_OPTIONS: { value: PortfolioConsultationStatus | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'ANSWERED', label: '답변완료' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
]

export default function AdminPortfolioConsultationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [consultations, setConsultations] = useState<PortfolioConsultation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<PortfolioConsultationStatus | ''>('')
  const [isDeletedFilter, setIsDeletedFilter] = useState<boolean | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '0')
    const status = (searchParams.get('status') as PortfolioConsultationStatus) || ''
    const isDeleted = searchParams.get('isDeleted')
    const kw = searchParams.get('keyword') || ''

    setCurrentPage(page)
    setSelectedStatus(status)
    setIsDeletedFilter(isDeleted === null ? undefined : isDeleted === 'true')
    setKeyword(kw)
    setSearchKeyword(kw)
    fetchConsultations(page, status, isDeleted === null ? undefined : isDeleted === 'true', kw)
  }, [searchParams])

  const fetchConsultations = async (
    page: number = 0,
    status: PortfolioConsultationStatus | '' = '',
    isDeleted?: boolean,
    kw?: string
  ) => {
    setIsLoading(true)
    try {
      const result = await getAdminPortfolioConsultations({
        page,
        size: 20,
        status: status || undefined,
        isDeleted,
        keyword: kw || undefined,
        sort: 'createdAt,desc',
      })

      setConsultations(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (error) {
      showErrorToast(error, '상담신청 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const updateURLParams = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        urlParams.set(key, value)
      }
    })
    router.push(`/admin/portfolio-consultations?${urlParams.toString()}`)
  }

  const handleStatusChange = (status: PortfolioConsultationStatus | '') => {
    updateURLParams({
      status: status || undefined,
      isDeleted: isDeletedFilter?.toString(),
      keyword: searchKeyword || undefined,
      page: '0',
    })
  }

  const handleDeletedFilterChange = (value: string) => {
    const isDeleted = value === '' ? undefined : value === 'true'
    updateURLParams({
      status: selectedStatus || undefined,
      isDeleted: isDeleted?.toString(),
      keyword: searchKeyword || undefined,
      page: '0',
    })
  }

  const handleSearch = () => {
    updateURLParams({
      status: selectedStatus || undefined,
      isDeleted: isDeletedFilter?.toString(),
      keyword: keyword || undefined,
      page: '0',
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePageChange = (page: number) => {
    updateURLParams({
      status: selectedStatus || undefined,
      isDeleted: isDeletedFilter?.toString(),
      keyword: searchKeyword || undefined,
      page: page.toString(),
    })
  }

  const handleStatusUpdate = async (uuid: string, newStatus: PortfolioConsultationStatus) => {
    try {
      await updateAdminConsultationStatus(uuid, newStatus)
      showSuccessToast('상태가 변경되었습니다')
      fetchConsultations(currentPage, selectedStatus, isDeletedFilter, searchKeyword)
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    }
  }

  const handleDelete = async (uuid: string, name: string) => {
    if (!confirm(`정말로 "${name}"의 상담신청을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminPortfolioConsultation(uuid)
      showSuccessToast('상담신청이 삭제되었습니다')
      fetchConsultations(currentPage, selectedStatus, isDeletedFilter, searchKeyword)
    } catch (error) {
      showErrorToast(error, '상담신청 삭제에 실패했습니다')
    }
  }

  const handleRestore = async (uuid: string) => {
    try {
      await restoreAdminPortfolioConsultation(uuid)
      showSuccessToast('상담신청이 복구되었습니다')
      fetchConsultations(currentPage, selectedStatus, isDeletedFilter, searchKeyword)
    } catch (error) {
      showErrorToast(error, '상담신청 복구에 실패했습니다')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'PHONE':
        return <FiPhone className="w-4 h-4" />
      case 'EMAIL':
        return <FiMail className="w-4 h-4" />
      case 'KAKAO':
        return <FiMessageCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">포트폴리오 상담신청 관리</h1>
            <p className="text-gray-600">
              총 <span className="font-semibold text-primary">{totalElements}</span>개의 상담신청
            </p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
          {/* 상태 필터 */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 검색 및 추가 필터 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="이름, 이메일, 제목, 내용 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              검색
            </button>
            <select
              value={isDeletedFilter === undefined ? '' : isDeletedFilter.toString()}
              onChange={(e) => handleDeletedFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">삭제 여부 전체</option>
              <option value="false">정상</option>
              <option value="true">삭제됨</option>
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              상담신청이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">신청자</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">포트폴리오</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">업체</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">연락방법</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">상태</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">신청일</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consultations.map((consultation) => (
                    <tr
                      key={consultation.uuid}
                      className={`hover:bg-gray-50 ${consultation.isDeleted ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{consultation.name}</div>
                        <div className="text-sm text-gray-500">{consultation.email}</div>
                        <div className="text-sm text-gray-500">{consultation.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/portfolios/${consultation.portfolioUuid}`}
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          {consultation.portfolioTitle?.length > 20
                            ? consultation.portfolioTitle.slice(0, 20) + '...'
                            : consultation.portfolioTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{consultation.companyName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 max-w-[200px] truncate">
                          {consultation.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          {getContactMethodIcon(consultation.contactMethod)}
                          {CONTACT_METHOD_LABELS[consultation.contactMethod]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={consultation.status}
                          onChange={(e) =>
                            handleStatusUpdate(consultation.uuid, e.target.value as PortfolioConsultationStatus)
                          }
                          className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
                            STATUS_BADGE_STYLES[consultation.status]
                          }`}
                        >
                          {STATUS_OPTIONS.filter((o) => o.value !== '').map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {consultation.isDeleted && (
                          <div className="text-xs text-red-600 mt-1">삭제됨</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {formatDate(consultation.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/portfolio-consultations/${consultation.uuid}`}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="상세보기"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {consultation.isDeleted ? (
                            <button
                              onClick={() => handleRestore(consultation.uuid)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="복구"
                            >
                              <FiRotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(consultation.uuid, consultation.name)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
