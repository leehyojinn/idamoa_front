'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiPlus, FiClock, FiUser, FiMessageSquare } from 'react-icons/fi'
import { getConsultations, getMyConsultations } from '@/lib/api/consultation'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Checkbox from '@/components/ui/Checkbox'
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

export default function ConsultationsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [consultations, setConsultations] = useState<ConsultationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<ConsultationStatus | ''>('')
  const [onlyMyPosts, setOnlyMyPosts] = useState(false)

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '0')
    const status = (searchParams.get('status') as ConsultationStatus) || ''
    const myPosts = searchParams.get('onlyMyPosts') === 'true'

    setCurrentPage(page)
    setSelectedStatus(status)
    setOnlyMyPosts(myPosts)
    fetchConsultations(page, status, myPosts)
  }, [searchParams])

  const fetchConsultations = async (page: number = 0, status: ConsultationStatus | '' = '', myPosts: boolean = false) => {
    setIsLoading(true)
    try {
      let result

      if (myPosts) {
        // 내글만보기: /consultations/my API 사용
        result = await getMyConsultations({
          page,
          size: 12,
        })
      } else {
        // 전체 목록: /consultations API 사용
        result = await getConsultations({
          page,
          size: 12,
          status: status || undefined,
        })
      }

      if (result.success && result.data) {
        let consultations = result.data.content

        // 내글만보기일 때 클라이언트 사이드에서 status 필터링
        if (myPosts && status) {
          consultations = consultations.filter(c => c.status === status)
        }

        setConsultations(consultations)
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
    if (onlyMyPosts) params.set('onlyMyPosts', 'true')
    params.set('page', '0')
    router.push(`/consultations?${params.toString()}`)
  }

  const handleMyPostsToggle = (checked: boolean) => {
    const params = new URLSearchParams()
    if (checked) params.set('onlyMyPosts', 'true')
    if (selectedStatus) params.set('status', selectedStatus)
    params.set('page', '0')
    router.push(`/consultations?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (selectedStatus) params.set('status', selectedStatus)
    if (onlyMyPosts) params.set('onlyMyPosts', 'true')
    router.push(`/consultations?${params.toString()}`)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">빠른상담</h1>
            <p className="text-gray-600">
              총 <span className="font-semibold text-blue-600">{totalElements}</span>개의 상담
            </p>
          </div>
          <Link
            href="/consultations/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus />
            상담 신청하기
          </Link>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* 내글만보기 체크박스 */}
            {user && (
              <>
                <Checkbox
                  checked={onlyMyPosts}
                  onChange={handleMyPostsToggle}
                  label="내글만보기"
                  size="sm"
                />
                <div className="h-6 w-px bg-gray-300"></div>
              </>
            )}

            {/* 상태 필터 버튼 */}
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
                신청완료
              </button>
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                상담중
              </button>
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'COMPLETED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                상담완료
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
            <p className="text-gray-500 text-lg mb-4">등록된 상담이 없습니다</p>
            <Link
              href="/consultations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <FiPlus />
              상담 신청하기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 mb-8">
              {consultations.map((consultation) => (
                <Link
                  key={consultation.uuid}
                  href={`/consultations/${consultation.uuid}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {consultation.subject || '상담 문의'}
                      </h3>
                      <p className="text-gray-600 line-clamp-2">
                        {consultation.messagePreview}
                      </p>
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${STATUS_COLORS[consultation.status]}`}>
                      {STATUS_LABELS[consultation.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <span>{consultation.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="text-gray-400" />
                      <span>{new Date(consultation.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {consultation.hasResponse && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        답변완료
                      </span>
                    )}
                    {consultation.isMyConsultation && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        내 상담
                      </span>
                    )}
                  </div>
                </Link>
              ))}
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
    </>
  )
}
