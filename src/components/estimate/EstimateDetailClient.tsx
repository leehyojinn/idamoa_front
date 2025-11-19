'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoCallOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoArrowBack,
  IoCreateOutline,
  IoTrashOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoAddCircleOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'
import { useAuthStore } from '@/stores/authStore'
import { deleteEstimateRequest, publishEstimateRequest, type EstimateRequestDetail } from '@/lib/api/estimate'
import { getProposalsByRequest, acceptProposal, rejectProposal, type Proposal } from '@/lib/api/proposal'
import { checkCompanyExists } from '@/lib/api/company'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useDialog } from '@/hooks/useDialog'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/button'
import AttachmentList from '@/components/ui/AttachmentList'

interface EstimateDetailClientProps {
  estimate: EstimateRequestDetail
}

export default function EstimateDetailClient({ estimate }: EstimateDetailClientProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { confirm } = useDialog()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [hasMyProposal, setHasMyProposal] = useState(false)
  const [isCheckingProposal, setIsCheckingProposal] = useState(true)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
  const [myProposal, setMyProposal] = useState<Proposal | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectingProposalUuid, setRejectingProposalUuid] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [acceptingProposalUuid, setAcceptingProposalUuid] = useState<string>('')
  const [isAcceptingProposal, setIsAcceptingProposal] = useState(false)

  const isOwner = user?.email === estimate.userEmail
  const isCompany = user?.currentRole === 'COMPANY'
  const isAccepting = estimate.status === 'PUBLISHED' && (!estimate.expiresAt || new Date(estimate.expiresAt) >= new Date())
  const canSubmitProposal = isCompany && !isOwner && !hasMyProposal && isAccepting

  // 수락된 제안이 있는지 확인
  const hasAcceptedProposal = proposals.some(p => p.status === 'SELECTED')
  // 실제 표시할 상태 (수락된 제안이 있으면 MATCHED로 표시)
  const displayStatus = hasAcceptedProposal ? 'MATCHED' : estimate.status

  // Check if user has already submitted a proposal
  useEffect(() => {
    const checkMyProposal = async () => {
      if (!user || !isCompany || isOwner) {
        setIsCheckingProposal(false)
        return
      }

      try {
        const result = await getProposalsByRequest(estimate.uuid)
        if (result.success && result.data) {
          if (Array.isArray(result.data)) {
            const proposalsList = result.data as Proposal[]
            const hasProposal = proposalsList.length > 0
            setHasMyProposal(hasProposal)
            if (hasProposal) {
              setMyProposal(proposalsList[0]) // 업체는 하나의 제안만 제출 가능
            }
          }
        }
      } catch (error) {
        // Ignore error - user might not have permission
      } finally {
        setIsCheckingProposal(false)
      }
    }

    checkMyProposal()
  }, [user, isCompany, isOwner, estimate.uuid])

  // Load proposals if owner
  useEffect(() => {
    const fetchProposals = async () => {
      if (!isOwner) return

      setIsLoadingProposals(true)
      try {
        const result = await getProposalsByRequest(estimate.uuid)
        if (result.success && result.data && Array.isArray(result.data)) {
          setProposals(result.data as Proposal[])
        }
      } catch (error) {
        // Ignore error
      } finally {
        setIsLoadingProposals(false)
      }
    }

    fetchProposals()
  }, [isOwner, estimate.uuid])

  const handleAcceptProposal = (proposalUuid: string) => {
    setAcceptingProposalUuid(proposalUuid)
    setIsAcceptDialogOpen(true)
  }

  const confirmAcceptProposal = async () => {
    if (!acceptingProposalUuid) return

    setIsAcceptingProposal(true)
    try {
      const result = await acceptProposal(acceptingProposalUuid)

      if (result.success) {
        showSuccessToast('제안을 수락했습니다')

        // 제안 목록 새로고침
        const refreshResult = await getProposalsByRequest(estimate.uuid)
        if (refreshResult.success && Array.isArray(refreshResult.data)) {
          setProposals(refreshResult.data)
        }

        setIsAcceptDialogOpen(false)
        setAcceptingProposalUuid('')
      }
    } catch (error) {
      showErrorToast(error, '제안 수락에 실패했습니다')
    } finally {
      setIsAcceptingProposal(false)
    }
  }

  const handleRejectProposal = (proposalUuid: string) => {
    setRejectingProposalUuid(proposalUuid)
    setRejectReason('')
    setIsRejectDialogOpen(true)
  }

  const handleSubmitProposal = async () => {
    // 업체 등록 여부 확인
    try {
      const checkResult = await checkCompanyExists()

      if (!checkResult.success || !checkResult.data?.hasCompany) {
        // 업체 미등록
        confirm('제안서를 제출하려면 업체 프로필 등록이 필요합니다.\n업체 프로필을 등록하시겠습니까?', {
          title: '업체 프로필 필요',
          confirmText: '등록하러 가기',
          cancelText: '취소',
          onConfirm: () => {
            router.push('/mypage/company-register')
          },
        })
        return
      }

      // 업체 상세정보 확인
      const { getMyCompany } = await import('@/lib/api/company')
      const companyResult = await getMyCompany()

      if (!companyResult.success || !companyResult.data) {
        showErrorToast(null, '업체 정보를 불러오는데 실패했습니다')
        return
      }

      const company = companyResult.data

      // 업체 상세정보 필수 항목 체크
      const hasRequiredInfo =
        company.name &&
        company.primaryPhone &&
        company.email &&
        company.detailContent

      if (!hasRequiredInfo) {
        confirm('제안서를 제출하려면 업체 상세정보 등록이 필요합니다.\n마이페이지에서 업체 상세정보를 등록하시겠습니까?', {
          title: '업체 상세정보 필요',
          confirmText: '등록하러 가기',
          cancelText: '취소',
          onConfirm: () => {
            router.push('/mypage')
          },
        })
        return
      }

      // 모든 조건 충족 시 제안서 작성 페이지로 이동
      router.push(`/estimates/${estimate.uuid}/proposals/create`)
    } catch (error) {
      showErrorToast(error, '업체 정보 확인에 실패했습니다')
    }
  }

  const confirmRejectProposal = async () => {
    if (!rejectingProposalUuid) return

    setIsRejecting(true)
    try {
      const result = await rejectProposal(rejectingProposalUuid, rejectReason || undefined)
      if (result.success) {
        showSuccessToast('제안을 거절했습니다')

        // 제안 목록 새로고침
        const refreshResult = await getProposalsByRequest(estimate.uuid)
        if (refreshResult.success && Array.isArray(refreshResult.data)) {
          setProposals(refreshResult.data)
        }

        setIsRejectDialogOpen(false)
        setRejectingProposalUuid('')
        setRejectReason('')
      }
    } catch (error) {
      showErrorToast(error, '제안 거절에 실패했습니다')
    } finally {
      setIsRejecting(false)
    }
  }

  const formatPrice = (price: number) => {
    return `${(price / 10000).toLocaleString()}만원`
  }

  const getProposalStatusBadge = (status: string) => {
    const statusMap = {
      SUBMITTED: { label: '제출됨', color: 'bg-blue-100 text-blue-700' },
      VIEWED: { label: '확인됨', color: 'bg-green-100 text-green-700' },
      SELECTED: { label: '수락됨', color: 'bg-purple-100 text-purple-700' },
      REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-700' },
      WITHDRAWN: { label: '철회됨', color: 'bg-gray-100 text-gray-700' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.SUBMITTED
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  // requirements 객체에서 정보 추출
  const requirementsData = typeof estimate.requirements === 'object' && estimate.requirements !== null
    ? estimate.requirements as Record<string, any>
    : null

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
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
      // 객체인 경우 첫 번째 속성 값 반환
      const keys = Object.keys(value)
      if (keys.length > 0) {
        return value[keys[0]]
      }
    }
    return undefined
  }

  const getStatusBadge = (status: string, expiresAt?: string) => {
    // 마감일시 체크
    const isExpired = expiresAt && new Date(expiresAt) < new Date()

    const statusMap = {
      DRAFT: { label: '임시저장', color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-300' },
      PUBLISHED: {
        label: isExpired ? '마감' : '접수중',
        color: isExpired
          ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-300'
          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300'
      },
      IN_PROGRESS: { label: '진행중', color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-300' },
      MATCHED: { label: '매칭완료', color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-300' },
      COMPLETED: { label: '완료', color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-300' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.DRAFT
    return (
      <span className={`px-5 py-2 rounded-full text-sm font-bold shadow-sm ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteEstimateRequest(estimate.uuid)
      if (result.success) {
        showSuccessToast('견적 요청이 삭제되었습니다')
        router.push('/estimates')
      }
    } catch (error) {
      showErrorToast(error, '견적 요청 삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const result = await publishEstimateRequest(estimate.uuid)
      if (result.success) {
        showSuccessToast('견적 요청이 발행되었습니다')
        router.refresh()
      }
    } catch (error) {
      showErrorToast(error, '견적 요청 발행에 실패했습니다')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-all duration-200 hover:gap-3"
          >
            <IoArrowBack className="text-xl" />
            <span className="font-medium">목록으로</span>
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {getStatusBadge(displayStatus, estimate.expiresAt)}
            {estimate.visibility === 'PRIVATE' && (
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                비공개
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3 break-words leading-tight">{estimate.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="text-lg" />
              <span>등록일: {formatDate(estimate.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <IoPeopleOutline className="text-lg" />
              <span>제안 {estimate.proposals?.totalCount ?? estimate.proposalCount ?? 0}건</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner Actions */}
        {isOwner && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-wrap gap-3">
              {estimate.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <IoCloudUploadOutline className="text-xl" />
                  {isPublishing ? '발행 중...' : '발행하기'}
                </button>
              )}
              <button
                onClick={() => router.push(`/estimates/${estimate.uuid}/edit`)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <IoCreateOutline className="text-xl" />
                수정하기
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <IoTrashOutline className="text-xl" />
                삭제하기
              </button>
            </div>
          </div>
        )}

        {/* Company Actions */}
        {isCompany && !isOwner && !isCheckingProposal && (
          <>
            {canSubmitProposal ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
                <button
                  onClick={handleSubmitProposal}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <IoAddCircleOutline className="text-xl" />
                  제안서 제출하기
                </button>
              </div>
            ) : hasMyProposal && myProposal ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                  <IoCheckmarkCircleOutline className="text-2xl text-blue-600" />
                  <p className="text-blue-900 font-semibold">이 견적에 대한 제안서를 제출하셨습니다</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getProposalStatusBadge(myProposal.status)}
                        {myProposal.isSelected && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            선택됨
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{myProposal.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{myProposal.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <IoPricetagOutline className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">제안 금액</p>
                        <p className="text-sm font-semibold text-gray-900">{formatPrice(myProposal.price)}</p>
                      </div>
                    </div>
                    {myProposal.validUntil && (
                      <div className="flex items-center gap-2">
                        <IoCalendarOutline className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">유효기간</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(myProposal.validUntil)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <IoCalendarOutline className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">제출일</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(myProposal.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/proposals/${myProposal.uuid}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Basic Info Grid - 상단 배치 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">기본 정보</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 예산 */}
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <IoPricetagOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">예산</p>
                <p className="font-bold text-gray-900 text-base break-words">
                  {formatBudget(estimate.budgetMin, estimate.budgetMax)}
                </p>
              </div>
            </div>

            {/* 의뢰인 */}
            {estimate.clientName && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                  <IoBusinessOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">의뢰인</p>
                  <p className="font-bold text-gray-900 break-words">
                    {user ? safeGetValue(estimate.clientName) : '***'}
                  </p>
                </div>
              </div>
            )}

            {/* 업종 */}
            {estimate.businessType && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                  <IoBusinessOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">업종</p>
                  <p className="font-bold text-gray-900 break-words">{safeGetValue(estimate.businessType)}</p>
                </div>
              </div>
            )}

            {/* 현장 주소 */}
            {requirementsData?.siteAddress && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                  <IoLocationOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">현장 주소</p>
                  <p className="font-bold text-gray-900 break-words">
                    {requirementsData.siteAddress === '미정' ? '미정' : requirementsData.siteAddress}
                  </p>
                </div>
              </div>
            )}

            {/* 견적 유형 */}
            {requirementsData?.estimateType && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-indigo-500 rounded-lg flex-shrink-0">
                  <IoBusinessOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">견적 유형</p>
                  <p className="font-bold text-gray-900 break-words">{requirementsData.estimateType}</p>
                </div>
              </div>
            )}

            {/* 면적 */}
            {(estimate.areaPyeong || requirementsData?.areaPyeong) && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-indigo-500 rounded-lg flex-shrink-0">
                  <IoBusinessOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">면적</p>
                  <p className="font-bold text-gray-900 break-words">
                    {safeGetValue(estimate.areaPyeong) || requirementsData?.areaPyeong}평
                    {requirementsData?.areaSqm && ` (${requirementsData.areaSqm}㎡)`}
                  </p>
                </div>
              </div>
            )}

            {/* 제출 마감일시 */}
            {estimate.expiresAt && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
                  <IoCalendarOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-red-600 mb-1 font-medium uppercase tracking-wide">제출 마감일시</p>
                  <p className="font-bold text-gray-900 break-words">
                    {formatDateTime(estimate.expiresAt)}
                  </p>
                </div>
              </div>
            )}

            {/* 희망 시작일 */}
            {(estimate.desiredStartDate || requirementsData?.desiredStartDate) && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                  <IoCalendarOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">희망 시작일</p>
                  <p className="font-bold text-gray-900 break-words">
                    {formatDate(estimate.desiredStartDate || requirementsData?.desiredStartDate)}
                  </p>
                </div>
              </div>
            )}

            {/* 희망 완료일 */}
            {(estimate.desiredEndDate || requirementsData?.desiredCompletionDate) && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                  <IoCalendarOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">희망 완료일</p>
                  <p className="font-bold text-gray-900 break-words">
                    {formatDate(estimate.desiredEndDate || requirementsData?.desiredCompletionDate)}
                  </p>
                </div>
              </div>
            )}

            {/* 담당자 */}
            {estimate.contactName && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                  <IoPersonOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">담당자</p>
                  <p className="font-bold text-gray-900 break-words">
                    {user ? safeGetValue(estimate.contactName) : '***'}
                  </p>
                </div>
              </div>
            )}

            {/* 연락처 */}
            {estimate.contactPhone && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                  <IoCallOutline className="text-white text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">연락처</p>
                  <p className="font-bold text-gray-900 break-words">
                    {user ? safeGetValue(estimate.contactPhone) : '***'}
                  </p>
                </div>
              </div>
            )}

            {/* 제안서 수 */}
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <IoPeopleOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wide">제안서</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {estimate.proposals?.totalCount ?? estimate.proposalCount ?? 0}건
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">상세 설명</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere text-lg">
                {estimate.description}
              </p>
              {estimate.requirements && typeof estimate.requirements === 'string' && (
                <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <IoCheckmarkCircleOutline className="text-blue-600 text-xl" />
                    요구사항
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{estimate.requirements}</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            {estimate.attachments && estimate.attachments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <AttachmentList attachments={estimate.attachments} />
              </div>
            )}

            {/* Images */}
            {estimate.images && estimate.images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">이미지</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {estimate.images.map((image, index) => (
                    <div key={index} className="group relative aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
                      <Image
                        src={image}
                        alt={`견적 요청 이미지 ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags & Skills */}
            {((estimate.tags && estimate.tags.length > 0) ||
              (estimate.requiredSkills && estimate.requiredSkills.length > 0)) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">태그 및 필요 기술</h2>
                </div>
                {estimate.tags && estimate.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">태그</h3>
                    <div className="flex flex-wrap gap-2">
                      {estimate.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-semibold hover:from-blue-200 hover:to-indigo-200 transition-colors duration-200 border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {estimate.requiredSkills && estimate.requiredSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">필요 기술</h3>
                    <div className="flex flex-wrap gap-2">
                      {estimate.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-semibold hover:from-green-200 hover:to-emerald-200 transition-colors duration-200 border border-green-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Proposals List - Owner Only */}
            {isOwner && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    제출된 제안서 <span className="text-blue-600">{proposals.length}</span>건
                  </h2>
                </div>

                {isLoadingProposals ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">제안서를 불러오는 중...</p>
                    </div>
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-12">
                    <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">아직 제출된 제안서가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getProposalStatusBadge(proposal.status)}
                              {proposal.isSelected && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                  선택됨
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/proposals/${proposal.uuid}`}
                              className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-2"
                            >
                              {proposal.title}
                            </Link>
                            <p className="text-gray-600 text-sm line-clamp-2">{proposal.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <IoBusinessOutline className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">업체</p>
                              <p className="text-sm font-semibold text-gray-900">{proposal.companyName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoPricetagOutline className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">제안 금액</p>
                              <p className="text-sm font-semibold text-gray-900">{formatPrice(proposal.price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoCalendarOutline className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">제출일</p>
                              <p className="text-sm font-semibold text-gray-900">{formatDate(proposal.createdAt)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          {(proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED') && (
                            <>
                              <button
                                onClick={() => handleAcceptProposal(proposal.uuid)}
                                className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                <IoCheckmarkCircleOutline />
                                수락
                              </button>
                              <button
                                onClick={() => handleRejectProposal(proposal.uuid)}
                                className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                <IoCloseCircleOutline />
                                거절
                              </button>
                            </>
                          )}
                          <Link
                            href={`/proposals/${proposal.uuid}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            상세보기
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>견적 요청 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 견적 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Proposal Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>제안 수락</DialogTitle>
            <DialogDescription>
              이 제안을 수락하시겠습니까? 수락 후에는 업체에 알림이 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAcceptDialogOpen(false)
                setAcceptingProposalUuid('')
              }}
              disabled={isAcceptingProposal}
              className="px-6"
            >
              취소
            </Button>
            <Button
              onClick={confirmAcceptProposal}
              disabled={isAcceptingProposal}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              {isAcceptingProposal ? '수락 중...' : '수락하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Proposal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>제안 거절</DialogTitle>
            <DialogDescription>
              제안을 거절하시겠습니까? 거절 사유를 입력하시면 업체에 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거절 사유 (선택사항)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력해주세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
              rows={4}
              disabled={isRejecting}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false)
                setRejectReason('')
                setRejectingProposalUuid('')
              }}
              disabled={isRejecting}
              className="px-6"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectProposal}
              disabled={isRejecting}
              className="px-6 bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? '거절 중...' : '거절하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
