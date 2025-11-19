'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IoCalendarOutline,
  IoPricetagOutline,
  IoBusinessOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoArrowForward,
} from 'react-icons/io5'
import { acceptProposal, rejectProposal, withdrawProposal, type Proposal } from '@/lib/api/proposal'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { useDialog } from '@/hooks/useDialog'
import AttachmentList from '@/components/ui/AttachmentList'

interface ProposalDetailClientProps {
  initialData: Proposal
  canAccept: boolean
  canReject: boolean
  canEdit: boolean
  canWithdraw: boolean
}

export default function ProposalDetailClient({
  initialData,
  canAccept,
  canReject,
  canEdit,
  canWithdraw,
}: ProposalDetailClientProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { confirm } = useDialog()
  const [proposal, setProposal] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

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

  const formatPrice = (price: number) => {
    return `${(price / 10000).toLocaleString()}만원`
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      SUBMITTED: { label: '제출됨', color: 'bg-blue-100 text-blue-700' },
      VIEWED: { label: '확인됨', color: 'bg-green-100 text-green-700' },
      SELECTED: { label: '수락됨', color: 'bg-purple-100 text-purple-700' },
      REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-700' },
      WITHDRAWN: { label: '철회됨', color: 'bg-gray-100 text-gray-700' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.SUBMITTED
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleAccept = async () => {
    confirm('이 제안을 수락하시겠습니까?', {
      title: '제안 수락',
      confirmText: '수락',
      cancelText: '취소',
      onConfirm: async () => {
        setIsLoading(true)
        try {
          const result = await acceptProposal(proposal.uuid)
          if (result.success && result.data) {
            setProposal(result.data)
            showSuccessToast('제안을 수락했습니다')
            router.refresh()
          }
        } catch (error) {
          showErrorToast(error, '제안 수락에 실패했습니다')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const handleReject = async () => {
    const reason = prompt('거절 사유를 입력하세요 (선택사항):')
    if (reason === null) return

    setIsLoading(true)
    try {
      const result = await rejectProposal(proposal.uuid, reason || undefined)
      if (result.success && result.data) {
        setProposal(result.data)
        showSuccessToast('제안을 거절했습니다')
        router.refresh()
      }
    } catch (error) {
      showErrorToast(error, '제안 거절에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    confirm('제안을 철회하시겠습니까? 이 작업은 되돌릴 수 없습니다.', {
      title: '제안 철회',
      confirmText: '철회',
      cancelText: '취소',
      onConfirm: async () => {
        setIsLoading(true)
        try {
          const result = await withdrawProposal(proposal.uuid)
          if (result.success) {
            showSuccessToast('제안을 철회했습니다. 다시 제안을 작성할 수 있습니다.')
            // 견적 의뢰 페이지로 이동하여 다시 제안 작성 가능
            router.push(`/estimates/${proposal.requestUuid}`)
          }
        } catch (error) {
          showErrorToast(error, '제안 철회에 실패했습니다')
        } finally {
          setIsLoading(false)
        }
      },
    })
  }

  const handleEdit = () => {
    router.push(`/proposals/${proposal.uuid}/edit`)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getStatusBadge(proposal.status)}
              {proposal.isSelected && (
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                  선택됨
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
            <p className="text-blue-100 text-lg">
              견적 요청: {proposal.requestTitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <IoBusinessOutline className="text-xl" />
            <span>{proposal.companyName}</span>
          </div>
          {(proposal.companySlug || proposal.companyUuid) && (
            <Link
              href={`/companies/${proposal.companySlug || proposal.companyUuid}`}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              <span className="font-medium">업체 상세보기</span>
              <IoArrowForward />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <IoCalendarOutline className="text-xl" />
            <span>{formatDateTime(proposal.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canAccept || canReject || canEdit || canWithdraw) && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="text-xl" />
                제안 수락
              </button>
            )}
            {canReject && (
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <IoCloseCircleOutline className="text-xl" />
                제안 거절
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <IoCreateOutline className="text-xl" />
                제안 수정
              </button>
            )}
            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <IoTrashOutline className="text-xl" />
                제안 철회
              </button>
            )}
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
            <IoDocumentTextOutline className="text-white text-xl" />
          </div>
          기본 정보
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 업체 정보 */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <div className="p-2 bg-orange-600 rounded-lg flex-shrink-0">
              <IoBusinessOutline className="text-white text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 mb-1">제안 업체</p>
              <p className="font-bold text-gray-900 text-lg break-words mb-2">
                {proposal.companyName}
              </p>
              {(proposal.companySlug || proposal.companyUuid) && (
                <Link
                  href={`/companies/${proposal.companySlug || proposal.companyUuid}`}
                  className="inline-flex items-center gap-1 text-sm text-orange-700 hover:text-orange-800 font-semibold transition-colors"
                >
                  업체 상세보기
                  <IoArrowForward className="text-xs" />
                </Link>
              )}
            </div>
          </div>

          {/* 제안 금액 */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
              <IoPricetagOutline className="text-white text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600 mb-1">제안 금액</p>
              <p className="font-bold text-gray-900 text-lg break-words">
                {formatPrice(proposal.price)}
              </p>
            </div>
          </div>

          {/* 유효기간 */}
          {proposal.validUntil && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl">
              <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                <IoTimeOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">유효기간</p>
                <p className="font-bold text-gray-900 break-words">
                  {formatDate(proposal.validUntil)}
                </p>
              </div>
            </div>
          )}

          {/* 제안 시작일 */}
          {proposal.proposedStartDate && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl">
              <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                <IoCalendarOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">제안 시작일</p>
                <p className="font-bold text-gray-900 break-words">
                  {formatDate(proposal.proposedStartDate)}
                </p>
              </div>
            </div>
          )}

          {/* 제안 완료일 */}
          {proposal.proposedEndDate && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl">
              <div className="p-2 bg-gray-600 rounded-lg flex-shrink-0">
                <IoCalendarOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">제안 완료일</p>
                <p className="font-bold text-gray-900 break-words">
                  {formatDate(proposal.proposedEndDate)}
                </p>
              </div>
            </div>
          )}

          {/* 선택 시각 */}
          {proposal.selectedAt && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="p-2 bg-purple-600 rounded-lg flex-shrink-0">
                <IoCheckmarkCircleOutline className="text-white text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">선택 시각</p>
                <p className="font-bold text-gray-900 break-words">
                  {formatDateTime(proposal.selectedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 제안 설명 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">제안 설명</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {proposal.description}
          </p>
        </div>
      </div>

      {/* 가격 상세 */}
      {proposal.pricingDetails && Object.keys(proposal.pricingDetails).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">가격 상세</h2>
          <div className="space-y-3">
            {Object.entries(proposal.pricingDetails).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{key}</span>
                <span className="text-gray-900 font-bold">
                  {typeof value === 'number' ? formatPrice(value) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일정 정보 */}
      {proposal.timeline && Object.keys(proposal.timeline).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">일정 정보</h2>
          <div className="space-y-3">
            {Object.entries(proposal.timeline).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{key}</span>
                <span className="text-gray-900 font-bold">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 첨부파일 */}
      {proposal.attachments && proposal.attachments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
          <AttachmentList attachments={proposal.attachments} />
        </div>
      )}
    </div>
  )
}
