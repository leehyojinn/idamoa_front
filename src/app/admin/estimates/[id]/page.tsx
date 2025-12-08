'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft } from 'react-icons/fi'
import {
  getEstimateRequest,
  changeEstimateRequestStatus,
  deleteEstimateRequest,
  type AdminEstimateRequest,
} from '@/lib/api/admin-estimate'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminEstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = parseInt(params.id as string)

  const [request, setRequest] = useState<AdminEstimateRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRequest = async () => {
    setIsLoading(true)
    try {
      const data = await getEstimateRequest(requestId)
      // 삭제된 항목이면 목록으로 리다이렉트
      if (data.isDeleted) {
        showErrorToast(null, '삭제된 견적 요청입니다.')
        router.push('/admin/estimates')
        return
      }
      setRequest(data)
    } catch (error) {
      showErrorToast(error, '견적 요청을 불러오는데 실패했습니다.')
      router.push('/admin/estimates')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  const handleChangeStatus = async (status: string) => {
    if (!request) return

    try {
      await changeEstimateRequestStatus(request.id, status as any)
      showSuccessToast('상태가 변경되었습니다.')
      fetchRequest()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!request) return
    if (!confirm(`정말로 "${request.title}" 견적 요청을 삭제하시겠습니까?`)) return

    try {
      await deleteEstimateRequest(request.id)
      showSuccessToast('견적 요청이 삭제되었습니다.')
      router.push('/admin/estimates')
    } catch (error) {
      showErrorToast(error, '견적 요청 삭제에 실패했습니다.')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!request) {
    return null
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/admin/estimates"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>ID: {request.id}</span>
              <span>•</span>
              <span>작성자: {request.userName} ({request.userEmail})</span>
              <span>•</span>
              <span>조회수: {request.viewCount || 0}</span>
              <span>•</span>
              <span>제안수: {request.proposalCount || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={request.status}
              onChange={(e) => handleChangeStatus(e.target.value)}
              className={`px-3 py-2 rounded text-sm font-medium ${getStatusBadgeClass(request.status)}`}
            >
              <option value="PUBLISHED">게시됨</option>
              <option value="CANCELLED">취소됨</option>
              <option value="COMPLETED">완료됨</option>
            </select>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {/* 기본 정보 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">카테고리</label>
                <p className="mt-1 text-gray-900">{request.category || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">위치</label>
                <p className="mt-1 text-gray-900">{request.location || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">상세 주소</label>
                <p className="mt-1 text-gray-900">{request.address || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">평수</label>
                <p className="mt-1 text-gray-900">{request.areaPyeong || 0}평</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">예산</label>
                <p className="mt-1 text-gray-900">
                  {request.budgetMin ? request.budgetMin.toLocaleString() : '0'} ~ {request.budgetMax ? request.budgetMax.toLocaleString() : '0'}원
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">희망 기간</label>
                <p className="mt-1 text-gray-900">
                  {request.desiredStartDate || '-'} ~ {request.desiredEndDate || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 의뢰인 정보 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">의뢰인 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">업체명</label>
                <p className="mt-1 text-gray-900">{request.clientName || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">사업자 유형</label>
                <p className="mt-1 text-gray-900">{request.businessType || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">담당자명</label>
                <p className="mt-1 text-gray-900">{request.contactName || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">연락처</label>
                <p className="mt-1 text-gray-900">{request.contactPhone || '-'}</p>
              </div>
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 설명</h2>
            <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* 요구사항 */}
          {request.requirements && Object.keys(request.requirements).length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">요구사항</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(request.requirements, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 태그 */}
          {request.tags && request.tags.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">태그</h2>
              <div className="flex gap-2 flex-wrap">
                {request.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 필요 기술 */}
          {request.requiredSkills && request.requiredSkills.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">필요 기술</h2>
              <div className="flex gap-2 flex-wrap">
                {request.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 이미지 */}
          {request.images && request.images.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">이미지</h2>
              <div className="grid grid-cols-3 gap-4">
                {request.images.map((image) => (
                  <div key={image.uuid}>
                    <Image
                      src={image.url}
                      alt={image.description || '견적 요청 이미지'}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {image.description && (
                      <p className="mt-2 text-sm text-gray-600">{image.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 첨부 파일 */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">첨부 파일</h2>
              <div className="space-y-2">
                {request.attachments.map((file) => (
                  <a
                    key={file.uuid}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.originalFilename}</p>
                      <p className="text-sm text-gray-500">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 메타 정보 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">메타 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">제출 마감일</label>
                <p className="mt-1 text-gray-900">
                  {new Date(request.submissionDeadline).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">만료일</label>
                <p className="mt-1 text-gray-900">
                  {new Date(request.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">생성일</label>
                <p className="mt-1 text-gray-900">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">수정일</label>
                <p className="mt-1 text-gray-900">
                  {new Date(request.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">공개 여부</label>
                <p className="mt-1 text-gray-900">{request.isPublic ? '공개' : '비공개'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">삭제 여부</label>
                <p className="mt-1 text-gray-900">{request.isDeleted ? '삭제됨' : '정상'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
