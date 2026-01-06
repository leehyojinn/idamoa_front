'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  getAdminRefund,
  approveRefund,
  rejectRefund,
  type AdminRefund,
} from '@/lib/api/admin-refund'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function RefundDetailPage() {
  const router = useRouter()
  const params = useParams()
  const refundUuid = params.refundUuid as string
  const { accessToken, _hasHydrated, user } = useAuthStore()

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [refund, setRefund] = useState<AdminRefund | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const presetReasons = [
    '환불 정책에 부합하지 않습니다',
    '충전 후 7일이 경과하였습니다',
    '이미 사용된 크레딧이 포함되어 있습니다',
    '계좌 정보가 올바르지 않습니다',
  ]

  // 인증 체크
  useEffect(() => {
    if (!_hasHydrated) return

    if (!accessToken || user?.currentRole !== 'ADMIN') {
      showErrorToast(null, '관리자 권한이 필요합니다')
      router.push('/admin')
      return
    }
    setIsCheckingAuth(false)
  }, [accessToken, _hasHydrated, user, router])

  // 데이터 로드
  useEffect(() => {
    if (isCheckingAuth) return
    fetchRefund()
  }, [isCheckingAuth, refundUuid])

  const fetchRefund = async () => {
    try {
      const result = await getAdminRefund(refundUuid)
      if (result.success && result.data) {
        setRefund(result.data)
      }
    } catch (error) {
      showErrorToast(error, '환불 정보를 불러오는데 실패했습니다')
      router.push('/admin/refunds')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('환불을 승인하시겠습니까?\n\n승인 후 실제 계좌 이체를 진행해주세요.')) {
      return
    }

    setProcessing(true)
    try {
      const result = await approveRefund(refundUuid)
      if (result.success) {
        showSuccessToast('환불이 승인되었습니다. 계좌로 환불 금액을 이체해주세요.')
        router.push('/admin/refunds')
      } else {
        showErrorToast(null, result.message || '환불 승인에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '환불 승인 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showErrorToast(null, '거부 사유를 입력해주세요')
      return
    }

    setProcessing(true)
    try {
      const result = await rejectRefund(refundUuid, {
        rejectionReason: rejectionReason.trim(),
      })
      if (result.success) {
        showSuccessToast('환불이 거부되었습니다. 사용자의 크레딧이 복구되었습니다.')
        router.push('/admin/refunds')
      } else {
        showErrorToast(null, result.message || '환불 거부에 실패했습니다')
      }
    } catch (error) {
      showErrorToast(error, '환불 거부 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
      setShowRejectModal(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      FAILED: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      PENDING: '대기 중',
      COMPLETED: '완료',
      REJECTED: '거부됨',
      FAILED: '실패',
    }

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || styles.FAILED}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (isCheckingAuth || loading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!refund) return null

  const isPending = refund.status === 'PENDING'

  return (
    <AdminGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <IoArrowBack className="text-xl" />
              목록으로
            </button>
            <h1 className="text-3xl font-bold text-gray-900">환불 상세</h1>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* 상태 배지 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">환불 정보</h2>
              {getStatusBadge(refund.status)}
            </div>

            {/* 신청자 정보 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">신청자 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">이름</span>
                  <p className="font-medium">{refund.userName || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">이메일</span>
                  <p className="font-medium">{refund.userEmail}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">신청일시</span>
                  <p className="font-medium">{formatDate(refund.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* 환불 정보 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">환불 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">환불 금액</span>
                  <p className="text-2xl font-bold text-primary">
                    {refund.refundAmount.toLocaleString()}원
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-sm">환불 사유</span>
                  <p className="font-medium">{refund.refundReason}</p>
                </div>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">환불 계좌</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">은행</span>
                    <p className="font-medium">{refund.bankName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">계좌번호</span>
                    <p className="font-medium">{refund.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">예금주</span>
                    <p className="font-medium">{refund.accountHolder}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 처리 정보 (처리된 경우) */}
            {!isPending && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">처리 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">처리일시</span>
                    <p className="font-medium">{formatDate(refund.processedAt)}</p>
                  </div>
                  {refund.rejectionReason && (
                    <div className="col-span-2">
                      <span className="text-gray-500 text-sm">거부 사유</span>
                      <p className="font-medium text-red-600">{refund.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 주의사항 (대기 중인 경우) */}
            {isPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">주의사항</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• 환불 승인 시, 실제 계좌 이체는 관리자가 수동으로 진행해야 합니다</li>
                  <li>• 환불 거부 시, 사용자의 크레딧이 자동으로 복구됩니다</li>
                  <li>• 처리 후에는 취소할 수 없으므로 신중하게 확인하세요</li>
                </ul>
              </div>
            )}

            {/* 처리 버튼 (대기 중인 경우) */}
            {isPending && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <IoCheckmarkCircle className="text-xl" />
                  {processing ? '처리 중...' : '환불 승인'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <IoCloseCircle className="text-xl" />
                  환불 거부
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 거부 사유 모달 */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">환불 거부</h3>
              <p className="text-gray-600 mb-4">
                거부 사유를 입력해주세요. 이 내용은 사용자에게 표시됩니다.
              </p>

              <div className="mb-4">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거부 사유를 입력하세요"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {presetReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
                <p className="text-sm text-red-800">
                  환불 거부 시, 사용자의 크레딧이 자동으로 복구됩니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                  }}
                  disabled={processing}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {processing ? '처리 중...' : '거부 확인'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
