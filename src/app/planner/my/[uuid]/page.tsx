'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  getMyPlannerApplication,
  deletePlannerApplication,
  STATUS_LABELS,
  STATUS_COLORS,
  CONSULTATION_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type PlannerApplicationResponse,
} from '@/lib/api/planner'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function MyPlannerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const uuid = params.uuid as string

  const [application, setApplication] = useState<PlannerApplicationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/planner/my')
    }
  }, [user, router])

  useEffect(() => {
    const fetchApplication = async () => {
      if (!uuid || !user) return

      setIsLoading(true)
      try {
        const response = await getMyPlannerApplication(uuid)
        if (response.success) {
          setApplication(response.data)
        }
      } catch (error) {
        showErrorToast(error, '신청서를 불러오는데 실패했습니다.')
        router.push('/planner/my')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchApplication()
    }
  }, [uuid, user, router])

  const handleDelete = async () => {
    if (!application) return

    setIsDeleting(true)
    try {
      const response = await deletePlannerApplication(application.uuid)
      if (response.success) {
        showSuccessToast('신청서가 삭제되었습니다.')
        router.push('/planner/my')
      }
    } catch (error) {
      showErrorToast(error, '신청서 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // 수정/삭제 가능 여부 (PENDING 상태만)
  const canEdit = application?.status === 'PENDING'

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!user) {
    return null
  }

  if (!application) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-20">
            <p className="text-gray-500">신청서를 찾을 수 없습니다.</p>
            <Link href="/planner/my" className="mt-4 inline-block text-blue-600 hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        {/* 뒤로가기 */}
        <div className="mb-6">
          <Link
            href="/planner/my"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            내 신청 목록으로
          </Link>
        </div>

        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{application.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[application.status]}`}>
              {STATUS_LABELS[application.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>신청일: {new Date(application.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>|</span>
            <span>수정일: {new Date(application.updatedAt).toLocaleDateString('ko-KR')}</span>
          </div>

          {/* 수정/삭제 버튼 */}
          {canEdit && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
              <Link
                href={`/planner/my/${application.uuid}/edit`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                수정하기
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제하기
              </button>
            </div>
          )}
        </div>

        {/* 상담 정보 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">상담 정보</h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">상담 방법</span>
              <p className="text-gray-900 font-medium mt-1">
                {CONSULTATION_METHOD_LABELS[application.consultationMethod]}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500">요청 내용</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {application.requestTypes.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {REQUEST_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">상세 내용</span>
              <p className="text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">
                {application.content}
              </p>
            </div>
          </div>
        </div>

        {/* 신청자 정보 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">신청자 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">성함</span>
              <p className="text-gray-900 font-medium mt-1">{application.applicantName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">연락처</span>
              <p className="text-gray-900 font-medium mt-1">{application.applicantPhone}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500">이메일</span>
              <p className="text-gray-900 font-medium mt-1">{application.applicantEmail}</p>
            </div>
          </div>
        </div>

        {/* 사업장 정보 */}
        {(application.businessName || application.businessAddress || application.businessAreaSize || application.businessType) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">사업장 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.businessName && (
                <div>
                  <span className="text-sm text-gray-500">사업장명</span>
                  <p className="text-gray-900 font-medium mt-1">{application.businessName}</p>
                </div>
              )}
              {application.businessType && (
                <div>
                  <span className="text-sm text-gray-500">업종/진료과목</span>
                  <p className="text-gray-900 font-medium mt-1">{application.businessType}</p>
                </div>
              )}
              {application.businessAreaSize && (
                <div>
                  <span className="text-sm text-gray-500">면적</span>
                  <p className="text-gray-900 font-medium mt-1">{application.businessAreaSize}</p>
                </div>
              )}
              {application.businessAddress && (
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-500">주소</span>
                  <p className="text-gray-900 font-medium mt-1">{application.businessAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 희망 일정 */}
        {application.preferredDates && application.preferredDates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">희망 상담 일정</h2>

            <div className="space-y-3">
              {application.preferredDates.map((date) => (
                <div
                  key={date.priority}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    {date.priority}순위
                  </span>
                  <span className="text-gray-900">
                    {date.preferredDate} {date.preferredTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 첨부파일 */}
        {application.attachments && application.attachments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">첨부파일</h2>

            <div className="space-y-2">
              {application.attachments.map((file) => (
                <a
                  key={file.fileId}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-blue-600 hover:underline">{file.fileName}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 관리자 답변 */}
        {application.adminResponse && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4 pb-3 border-b border-blue-200">관리자 답변</h2>
            <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
              {application.adminResponse}
            </p>
          </div>
        )}

        {/* 담당자 정보 */}
        {application.assignedAdminName && (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">담당자</h2>
            <p className="text-gray-700">{application.assignedAdminName}</p>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/planner/my"
            className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            목록으로
          </Link>
          <Link
            href="/planner/create"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 상담 신청
          </Link>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">신청서 삭제</h3>
            <p className="text-gray-600 mb-6">
              정말 이 신청서를 삭제하시겠습니까?<br />
              삭제된 신청서는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
