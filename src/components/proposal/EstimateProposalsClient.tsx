'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IoCalendarOutline,
  IoPricetagOutline,
  IoBusinessOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoArrowBack,
} from 'react-icons/io5'
import { getProposalsByRequest, acceptProposal, rejectProposal, type Proposal } from '@/lib/api/proposal'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/button'

interface EstimateProposalsClientProps {
  requestUuid: string
}

export default function EstimateProposalsClient({ requestUuid }: EstimateProposalsClientProps) {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectingProposalUuid, setRejectingProposalUuid] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [acceptingProposalUuid, setAcceptingProposalUuid] = useState<string>('')
  const [isAcceptingProposal, setIsAcceptingProposal] = useState(false)

  useEffect(() => {
    const fetchProposals = async () => {
      setIsLoading(true)
      try {
        const result = await getProposalsByRequest(requestUuid)
        if (result.success && result.data) {
          // 배열인 경우 (요청 작성자 또는 제안 제출 업체)
          if (Array.isArray(result.data)) {
            setProposals(result.data as Proposal[])
          } else {
            // 제안 개수만 반환된 경우 (일반 사용자)
            setError(true)
          }
        } else {
          setError(true)
        }
      } catch (error) {
        console.error('Failed to fetch proposals:', error)
        showErrorToast(error, '제안서 목록을 불러오는데 실패했습니다')
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProposals()
  }, [requestUuid])

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
      SUBMITTED: { label: '제출됨', color: 'bg-primary-100 text-primary' },
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

  const handleAccept = (proposalUuid: string) => {
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
        // 목록 새로고침
        const refreshResult = await getProposalsByRequest(requestUuid)
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

  const handleReject = (proposalUuid: string) => {
    setRejectingProposalUuid(proposalUuid)
    setRejectReason('')
    setIsRejectDialogOpen(true)
  }

  const confirmRejectProposal = async () => {
    if (!rejectingProposalUuid) return

    setIsRejecting(true)
    try {
      const result = await rejectProposal(rejectingProposalUuid, rejectReason || undefined)
      if (result.success) {
        showSuccessToast('제안을 거절했습니다')
        // 목록 새로고침
        const refreshResult = await getProposalsByRequest(requestUuid)
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

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">제안서 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-xl text-gray-500 mb-4">제안서 목록을 볼 권한이 없습니다</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-primary hover:bg-primary-800 text-white rounded-lg font-semibold transition-colors"
        >
          뒤로 가기
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <IoArrowBack className="text-xl" />
          <span className="font-medium">뒤로 가기</span>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          제출된 제안서 <span className="text-primary">{proposals.length}</span>건
        </h2>
        <p className="text-gray-600">제출된 제안서를 검토하고 수락하세요</p>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">아직 제출된 제안서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(proposal.status)}
                      {proposal.isSelected && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          선택됨
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/proposals/${proposal.uuid}`}
                      className="text-xl font-bold text-gray-900 hover:text-primary transition-colors mb-2 break-words block"
                    >
                      {proposal.title}
                    </Link>
                    <p className="text-gray-600 line-clamp-2 break-words">{proposal.description}</p>
                  </div>
                </div>

                {/* Company Info */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <IoBusinessOutline className="text-gray-400" />
                    <p className="text-gray-900 font-semibold">{proposal.companyName}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <IoPricetagOutline className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">제안 금액</p>
                      <p className="text-gray-900 font-medium">{formatPrice(proposal.price)}</p>
                    </div>
                  </div>
                  {proposal.validUntil && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoCalendarOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">유효기간</p>
                        <p className="text-gray-900 font-medium">{formatDate(proposal.validUntil)}</p>
                      </div>
                    </div>
                  )}
                  {proposal.selectedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <IoCalendarOutline className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-xs">선택 시각</p>
                        <p className="text-gray-900 font-medium">{formatDateTime(proposal.selectedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <IoCalendarOutline />
                    <span>{formatDate(proposal.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    {proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED' ? (
                      <>
                        <button
                          onClick={() => handleAccept(proposal.uuid)}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          <IoCheckmarkCircleOutline />
                          수락
                        </button>
                        <button
                          onClick={() => handleReject(proposal.uuid)}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          <IoCloseCircleOutline />
                          거절
                        </button>
                      </>
                    ) : null}
                    <Link
                      href={`/proposals/${proposal.uuid}`}
                      className="px-4 py-2 bg-primary hover:bg-primary-800 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  )
}
