'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoBusinessOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoAddCircleOutline,
} from 'react-icons/io5'
import { getEstimateRequests, getMyEstimateRequests, type EstimateRequestListResponse } from '@/lib/api/estimate'
import { getMyProposals, type ProposalListResponse } from '@/lib/api/proposal'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'

interface EstimatesListClientProps {
  initialData?: EstimateRequestListResponse
}

export default function EstimatesListClient({ initialData }: EstimatesListClientProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [data, setData] = useState<EstimateRequestListResponse | null>(initialData || null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'ALL' | 'MY' | 'MY_PROPOSALS'>('ALL')
  const [myEstimatesCount, setMyEstimatesCount] = useState<number>(0)
  const [myProposalsCount, setMyProposalsCount] = useState<number>(0)

  // 초기 데이터가 없을 때 클라이언트에서 fetch
  useEffect(() => {
    if (!initialData) {
      getEstimateRequests(0, 20, 'createdAt,desc')
        .then(result => {
          if (result.success && result.data) {
            setData(result.data)
          }
        })
        .catch(error => {
          showErrorToast(error, '견적 목록을 불러오는데 실패했습니다')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [initialData])

  // 사용자가 로그인했을 때 내 견적 개수 가져오기
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) {
        setMyEstimatesCount(0)
        setMyProposalsCount(0)
        return
      }

      try {
        // 내 견적 요청 개수 (삭제된 견적 제외)
        const myEstimatesResult = await getMyEstimateRequests(0, 100, 'createdAt,desc')
        if (myEstimatesResult.success && myEstimatesResult.data) {
          const activeEstimates = myEstimatesResult.data.content.filter(e => !e.deletedAt)
          setMyEstimatesCount(activeEstimates.length)
        }
      } catch (error) {
        // 내 견적 요청 API 에러 시 0으로 처리
        setMyEstimatesCount(0)
      }

      // 내 제안 개수 (철회된 제안 제외) - 업체만 조회
      if (user.currentRole === 'COMPANY') {
        try {
          const myProposalsResult = await getMyProposals(0, 100, 'createdAt,desc')
          if (myProposalsResult.success && myProposalsResult.data) {
            const activeProposals = myProposalsResult.data.content.filter(p => p.status !== 'WITHDRAWN')
            setMyProposalsCount(activeProposals.length)
          }
        } catch (error) {
          // 내 제안 API 에러 시 0으로 처리
          setMyProposalsCount(0)
        }
      } else {
        // 업체가 아니면 0으로 설정
        setMyProposalsCount(0)
      }
    }

    fetchCounts()
  }, [user])

  const fetchEstimates = async (page: number, mode: 'ALL' | 'MY' | 'MY_PROPOSALS' = viewMode) => {
    setIsLoading(true)
    try {
      let result
      if (mode === 'MY_PROPOSALS') {
        try {
          // 내가 제안한 견적 목록 가져오기
          const proposalsResult = await getMyProposals(page, 20, 'createdAt,desc')
          if (proposalsResult.success && proposalsResult.data) {
            // Proposal 데이터를 EstimateRequest 형식으로 변환 (철회된 제안만 제외)
            const proposals = proposalsResult.data.content.filter(p => p.status !== 'WITHDRAWN')
            const estimateRequests = proposals.map(proposal => ({
              id: proposal.requestId,
              uuid: proposal.requestUuid,
              userId: 0,
              userEmail: '',
              title: proposal.requestTitle,
              description: proposal.description,
              status: 'PUBLISHED' as const,
              visibility: 'PUBLIC' as const,
              clientName: '',
              businessType: '',
              location: '',
              areaPyeong: 0,
              budgetMin: proposal.price,
              budgetMax: proposal.price,
              submissionDeadline: proposal.validUntil,
              expiresAt: proposal.validUntil,
              proposalCount: 1,
              viewCount: 0,
              createdAt: proposal.createdAt,
              updatedAt: proposal.updatedAt,
            }))
            result = {
              success: true,
              data: {
                content: estimateRequests,
                pageable: proposalsResult.data.pageable,
                totalPages: Math.ceil(proposals.length / 20),
                totalElements: proposals.length,
                last: proposalsResult.data.last,
                first: proposalsResult.data.first,
                size: proposalsResult.data.size,
                number: proposalsResult.data.number,
                numberOfElements: proposals.length,
                empty: proposals.length === 0,
              }
            }
          }
        } catch (error) {
          // API가 없을 경우 빈 결과 반환
          showErrorToast(null, '내가 제안한 견적을 불러올 수 없습니다. API가 준비 중입니다.')
          result = {
            success: true,
            data: {
              content: [],
              pageable: { pageNumber: 0, pageSize: 20 },
              totalPages: 0,
              totalElements: 0,
              last: true,
              first: true,
              size: 20,
              number: 0,
              numberOfElements: 0,
              empty: true,
            }
          }
        }
      } else if (mode === 'MY') {
        result = await getMyEstimateRequests(page, 20, 'createdAt,desc')
        // 삭제된 견적 제외
        if (result?.success && result.data) {
          result.data.content = result.data.content.filter(e => !e.deletedAt)
          result.data.totalElements = result.data.content.length
          result.data.numberOfElements = result.data.content.length
          result.data.empty = result.data.content.length === 0
        }
      } else {
        result = await getEstimateRequests(page, 20, 'createdAt,desc')
      }

      if (result?.success && result.data) {
        setData(result.data)
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      showErrorToast(error, '견적 요청 목록을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return '예산 미정'
    if (min && max) {
      return `${(min / 10000).toLocaleString()}만원 ~ ${(max / 10000).toLocaleString()}만원`
    }
    if (min) return `${(min / 10000).toLocaleString()}만원 이상`
    if (max) return `${(max / 10000).toLocaleString()}만원 이하`
    return '예산 미정'
  }

  // 안전하게 값 추출 (객체일 경우 대비)
  const safeGetValue = (value: any): string | number | undefined => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'string' || typeof value === 'number') return value
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value)
      if (keys.length > 0) {
        return value[keys[0]]
      }
    }
    return undefined
  }

  // 위치 중복 제거 함수
  const formatLocation = (location: any): string => {
    const locationStr = safeGetValue(location)
    if (!locationStr || typeof locationStr !== 'string') return ''

    // "서울 성북구 서울 성북구 돌곶이로 88-18" 같은 중복 제거
    const parts = locationStr.split(' ')
    const seen = new Set<string>()
    const result: string[] = []

    for (const part of parts) {
      if (!seen.has(part)) {
        seen.add(part)
        result.push(part)
      }
    }

    return result.join(' ')
  }

  const getStatusBadge = (status: string, expiresAt?: string) => {
    // 마감일시 체크
    const isExpired = expiresAt && new Date(expiresAt) < new Date()

    const statusMap = {
      DRAFT: { label: '임시저장', color: 'bg-gray-100 text-gray-700' },
      PUBLISHED: {
        label: isExpired ? '마감' : '접수중',
        color: isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      },
      IN_PROGRESS: { label: '진행중', color: 'bg-blue-100 text-blue-700' },
      MATCHED: { label: '매칭완료', color: 'bg-purple-100 text-purple-700' },
      COMPLETED: { label: '완료', color: 'bg-gray-100 text-gray-700' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.DRAFT
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  // 필터링된 데이터
  const filteredData = (data?.content || []).filter((estimate) => {
    if (selectedStatus === 'ALL') return true
    if (selectedStatus === 'EXPIRED') {
      return estimate.status === 'PUBLISHED' && estimate.expiresAt && new Date(estimate.expiresAt) < new Date()
    }
    if (selectedStatus === 'ACTIVE') {
      return estimate.status === 'PUBLISHED' && (!estimate.expiresAt || new Date(estimate.expiresAt) >= new Date())
    }
    if (selectedStatus === 'MATCHED') {
      return estimate.status === 'MATCHED' || estimate.status === 'COMPLETED'
    }
    return estimate.status === selectedStatus
  })

  // 필터별 카운트
  const getStatusCount = (status: string) => {
    const content = data?.content || []
    if (status === 'ALL') return content.length
    if (status === 'EXPIRED') {
      return content.filter(e => e.status === 'PUBLISHED' && e.expiresAt && new Date(e.expiresAt) < new Date()).length
    }
    if (status === 'ACTIVE') {
      return content.filter(e => e.status === 'PUBLISHED' && (!e.expiresAt || new Date(e.expiresAt) >= new Date())).length
    }
    if (status === 'MATCHED') {
      return content.filter(e => e.status === 'MATCHED' || e.status === 'COMPLETED').length
    }
    return content.filter(e => e.status === status).length
  }

  const handleViewModeChange = async (mode: 'ALL' | 'MY' | 'MY_PROPOSALS') => {
    if ((mode === 'MY' || mode === 'MY_PROPOSALS') && !user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }
    setViewMode(mode)
    setCurrentPage(0)
    setSelectedStatus('ALL') // 모드 변경 시 상태 필터 초기화
    await fetchEstimates(0, mode)
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {viewMode === 'MY' ? '내 견적 요청' : viewMode === 'MY_PROPOSALS' ? '내가 제안한 견적' : '전체 견적 요청'} <span className="text-blue-600">{data?.totalElements || 0}</span>건
          </h2>
          <p className="text-gray-600">
            {viewMode === 'MY_PROPOSALS'
              ? '내가 제안서를 제출한 견적 요청 목록입니다'
              : '원하는 견적 요청을 선택하여 제안서를 제출하세요'}
          </p>
        </div>
        {user && (
          <button
            onClick={() => router.push('/estimates/create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <IoAddCircleOutline className="text-xl" />
            견적 요청하기
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({getStatusCount('ALL')})
          </button>
          <button
            onClick={() => setSelectedStatus('ACTIVE')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedStatus === 'ACTIVE'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            접수중 ({getStatusCount('ACTIVE')})
          </button>
          <button
            onClick={() => setSelectedStatus('EXPIRED')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedStatus === 'EXPIRED'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            마감 ({getStatusCount('EXPIRED')})
          </button>
          <button
            onClick={() => setSelectedStatus('MATCHED')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedStatus === 'MATCHED'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            매칭완료 ({getStatusCount('MATCHED')})
          </button>
        </div>

        {/* View Mode Toggle Buttons */}
        {user && (myEstimatesCount > 0 || myProposalsCount > 0) && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleViewModeChange('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 견적
            </button>
            {myEstimatesCount > 0 && (
              <button
                onClick={() => handleViewModeChange('MY')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'MY'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                내 견적만 보기
              </button>
            )}
            {myProposalsCount > 0 && (
              <button
                onClick={() => handleViewModeChange('MY_PROPOSALS')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === 'MY_PROPOSALS'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                내가 제안한 견적
              </button>
            )}
          </div>
        )}
      </div>

      {/* Estimates List */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">
            {selectedStatus === 'ALL'
              ? '등록된 견적 요청이 없습니다'
              : '해당 조건의 견적 요청이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((estimate) => (
            <Link
              key={estimate.id}
              href={`/estimates/${estimate.uuid}`}
              className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(estimate.status, estimate.expiresAt)}
                      {estimate.visibility === 'PRIVATE' && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          비공개
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 break-words">
                      {estimate.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 break-words">{estimate.description}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {estimate.clientName && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoBusinessOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">의뢰인</p>
                        <p className="text-gray-900 font-medium">{safeGetValue(estimate.clientName)}</p>
                      </div>
                    </div>
                  )}
                  {estimate.businessType && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoBusinessOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">업종</p>
                        <p className="text-gray-900 font-medium">{safeGetValue(estimate.businessType)}</p>
                      </div>
                    </div>
                  )}
                  {estimate.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoLocationOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">위치</p>
                        <p className="text-gray-900 font-medium">
                          {formatLocation(estimate.location) === '미정 미정 미정' || formatLocation(estimate.location) === '미정'
                            ? '미정'
                            : formatLocation(estimate.location)}
                        </p>
                      </div>
                    </div>
                  )}
                  {estimate.areaPyeong && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoBusinessOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">면적</p>
                        <p className="text-gray-900 font-medium">{safeGetValue(estimate.areaPyeong)}평</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget & Deadline */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <IoPricetagOutline className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatBudget(estimate.budgetMin, estimate.budgetMax)}
                    </span>
                  </div>
                  {estimate.submissionDeadline && (
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                      <IoCalendarOutline className="text-red-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        마감일시: {formatDateTime(estimate.submissionDeadline)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <IoPeopleOutline />
                      <span>제안 {estimate.proposalCount}건</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IoCalendarOutline />
                      <span>{formatDate(estimate.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                    상세보기 →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => fetchEstimates(currentPage - 1)}
              disabled={data.first || isLoading}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, Math.max(1, data.totalPages)) }, (_, i) => {
                let pageNum = currentPage
                if (currentPage < 2) pageNum = i
                else if (currentPage >= data.totalPages - 2) pageNum = Math.max(0, data.totalPages - 5) + i
                else pageNum = currentPage - 2 + i

                if (pageNum < 0 || pageNum >= data.totalPages) return null

                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchEstimates(pageNum)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => fetchEstimates(currentPage + 1)}
              disabled={data.last || isLoading}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
