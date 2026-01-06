'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  adminGetPlannerApplication,
  adminChangePlannerApplicationStatus,
  adminAddPlannerApplicationResponse,
  adminAddPlannerApplicationMemo,
  STATUS_LABELS,
  STATUS_COLORS,
  CONSULTATION_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type PlannerApplicationStatus,
  type PlannerApplicationResponse,
} from '@/lib/api/planner'
import { getAdminUsers, assignPlannerAdmin } from '@/lib/api/admin'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AdminPlannerApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [application, setApplication] = useState<PlannerApplicationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // 모달 상태
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showMemoModal, setShowMemoModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  // 입력 상태
  const [selectedStatus, setSelectedStatus] = useState<PlannerApplicationStatus>('PENDING')
  const [responseText, setResponseText] = useState('')
  const [memoText, setMemoText] = useState('')

  // 관리자 목록
  const [adminUsers, setAdminUsers] = useState<Array<{ id: number; uuid: string; email: string; name: string; roles: string[]; status: string }>>([])
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null)

  const fetchApplication = async () => {
    setIsLoading(true)
    try {
      const response = await adminGetPlannerApplication(uuid)
      if (response.success) {
        setApplication(response.data)
        setSelectedStatus(response.data.status)
        setResponseText(response.data.adminResponse || '')
        setMemoText(response.data.adminMemo || '')
      }
    } catch (error) {
      showErrorToast(error, '신청서를 불러오는데 실패했습니다.')
      router.push('/admin/planner-applications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (uuid) {
      fetchApplication()
    }
  }, [uuid])

  const handleStatusChange = async () => {
    if (!application) return
    setIsUpdating(true)
    try {
      const response = await adminChangePlannerApplicationStatus(uuid, selectedStatus)
      if (response.success) {
        setApplication(response.data)
        showSuccessToast('상태가 변경되었습니다.')
        setShowStatusModal(false)
      }
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResponseSubmit = async () => {
    if (!application || !responseText.trim()) return
    setIsUpdating(true)
    try {
      const response = await adminAddPlannerApplicationResponse(uuid, responseText)
      if (response.success) {
        setApplication(response.data)
        showSuccessToast('답변이 등록되었습니다.')
        setShowResponseModal(false)
      }
    } catch (error) {
      showErrorToast(error, '답변 등록에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMemoSubmit = async () => {
    if (!application || !memoText.trim()) return
    setIsUpdating(true)
    try {
      const response = await adminAddPlannerApplicationMemo(uuid, memoText)
      if (response.success) {
        setApplication(response.data)
        showSuccessToast('메모가 등록되었습니다.')
        setShowMemoModal(false)
      }
    } catch (error) {
      showErrorToast(error, '메모 등록에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const fetchAdminUsers = async () => {
    try {
      const users = await getAdminUsers()
      setAdminUsers(users)
    } catch (error) {
      showErrorToast(error, '관리자 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleAssignAdmin = async () => {
    if (!application || selectedAdminId === null) return
    setIsUpdating(true)
    try {
      await assignPlannerAdmin(uuid, selectedAdminId)
      showSuccessToast('담당자가 배정되었습니다.')
      setShowAssignModal(false)
      fetchApplication()
    } catch (error) {
      showErrorToast(error, '담당자 배정에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="text-center text-gray-500">로딩 중...</div>
        </div>
        <Footer />
      </>
    )
  }

  if (!application) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="text-center text-gray-500">신청서를 찾을 수 없습니다.</div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/planner-applications"
            className="text-primary hover:text-primary text-sm mb-2 inline-block"
          >
            &larr; 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{application.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[application.status]}`}>
              {STATUS_LABELS[application.status]}
            </span>
            <span className="text-gray-500 text-sm">
              {new Date(application.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setShowStatusModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          상태 변경
        </button>
        <button
          onClick={() => {
            fetchAdminUsers()
            setShowAssignModal(true)
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          담당자 배정
        </button>
        <button
          onClick={() => setShowResponseModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          답변 등록
        </button>
        <button
          onClick={() => setShowMemoModal(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          메모 등록
        </button>
      </div>

      <div className="space-y-6">
        {/* 상담 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">상담 정보</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">상담 방법</dt>
              <dd className="mt-1 text-gray-900">
                {CONSULTATION_METHOD_LABELS[application.consultationMethod]}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">요청 내용</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {application.requestTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded"
                  >
                    {REQUEST_TYPE_LABELS[type]}
                  </span>
                ))}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">상세 내용</dt>
              <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{application.content}</dd>
            </div>
          </dl>
        </div>

        {/* 신청자 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">신청자 정보</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">성함</dt>
              <dd className="mt-1 text-gray-900">{application.applicantName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">연락처</dt>
              <dd className="mt-1 text-gray-900">{application.applicantPhone}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">이메일</dt>
              <dd className="mt-1 text-gray-900">{application.applicantEmail}</dd>
            </div>
          </dl>
        </div>

        {/* 사업장 정보 */}
        {(application.businessName || application.businessAddress) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">사업장 정보</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.businessName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">사업장명</dt>
                  <dd className="mt-1 text-gray-900">{application.businessName}</dd>
                </div>
              )}
              {application.businessAreaSize && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">면적</dt>
                  <dd className="mt-1 text-gray-900">{application.businessAreaSize}</dd>
                </div>
              )}
              {application.businessType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">업종/진료과목</dt>
                  <dd className="mt-1 text-gray-900">{application.businessType}</dd>
                </div>
              )}
              {application.businessAddress && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">주소</dt>
                  <dd className="mt-1 text-gray-900">{application.businessAddress}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 희망 일정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">희망 상담 일정</h2>
          <div className="space-y-2">
            {application.preferredDates.map((date) => (
              <div key={date.priority} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-primary">{date.priority}순위</span>
                <span className="text-gray-900">{date.preferredDate}</span>
                <span className="text-gray-600">{date.preferredTime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 관리자 답변 */}
        {application.adminResponse && (
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4 border-b border-green-200 pb-2">
              관리자 답변
            </h2>
            <p className="text-green-900 whitespace-pre-wrap">{application.adminResponse}</p>
          </div>
        )}

        {/* 관리자 메모 */}
        {application.adminMemo && (
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4 border-b border-yellow-200 pb-2">
              내부 메모 (사용자에게 보이지 않음)
            </h2>
            <p className="text-yellow-900 whitespace-pre-wrap">{application.adminMemo}</p>
          </div>
        )}

        {/* 담당자 정보 */}
        {application.assignedAdminName && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">담당자</h2>
            <p className="text-gray-900">{application.assignedAdminName}</p>
          </div>
        )}
      </div>

      {/* 상태 변경 모달 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">상태 변경</h3>
            <div className="space-y-2 mb-6">
              {(Object.keys(STATUS_LABELS) as PlannerApplicationStatus[]).map((status) => (
                <label
                  key={status}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                    selectedStatus === status ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={() => setSelectedStatus(status)}
                    className="sr-only"
                  />
                  <span className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleStatusChange}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
              >
                {isUpdating ? '변경 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 답변 등록 모달 */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">답변 등록</h3>
            <p className="text-sm text-gray-500 mb-4">이 답변은 사용자에게 표시됩니다.</p>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none mb-4"
              placeholder="답변 내용을 입력하세요..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleResponseSubmit}
                disabled={isUpdating || !responseText.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 등록 모달 */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">내부 메모 등록</h3>
            <p className="text-sm text-gray-500 mb-4">이 메모는 관리자만 볼 수 있습니다.</p>
            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none mb-4"
              placeholder="메모 내용을 입력하세요..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowMemoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleMemoSubmit}
                disabled={isUpdating || !memoText.trim()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {isUpdating ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 담당자 배정 모달 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">담당자 배정</h3>
            <p className="text-sm text-gray-500 mb-4">배정할 관리자를 선택하세요.</p>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {!adminUsers || adminUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-4">관리자를 불러오는 중...</div>
              ) : (
                adminUsers.map((admin) => (
                  <label
                    key={admin.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                      selectedAdminId === admin.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="admin"
                      value={admin.id}
                      checked={selectedAdminId === admin.id}
                      onChange={() => setSelectedAdminId(admin.id)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAssignAdmin}
                disabled={isUpdating || selectedAdminId === null}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isUpdating ? '배정 중...' : '배정'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  )
}
