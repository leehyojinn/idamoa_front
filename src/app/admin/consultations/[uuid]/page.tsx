'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiClock, FiUser, FiPhone, FiMail, FiMessageSquare, FiSave } from 'react-icons/fi'
import {
  adminGetConsultation,
  adminUpdateStatus,
  adminCreateResponse,
  adminDeleteConsultation
} from '@/lib/api/consultation'
import { getCompanies, assignConsultationToCompany } from '@/lib/api/admin'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { Consultation, ConsultationStatus } from '@/types/consultation'

const STATUS_LABELS = {
  SUBMITTED: '접수됨',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
}

const STATUS_COLORS = {
  SUBMITTED: 'bg-primary-100 text-primary-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

export default function AdminConsultationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<ConsultationStatus>('SUBMITTED')
  const [responseMessage, setResponseMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 업체 배정 모달 관련
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [companies, setCompanies] = useState<Array<{ uuid: string; name: string; description: string; primaryPhone: string; email: string; address: string }>>([])
  const [selectedCompanyUuid, setSelectedCompanyUuid] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchConsultation = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await adminGetConsultation(uuid)
      if (result.success && result.data) {
        setConsultation(result.data)
        setSelectedStatus(result.data.status)
        setResponseMessage(result.data.responseMessage || '')
      }
    } catch (error) {
      showErrorToast(error, '상담 조회에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [uuid])

  useEffect(() => {
    fetchConsultation()
  }, [fetchConsultation])

  const handleStatusUpdate = async () => {
    if (!consultation) return

    setIsSubmitting(true)
    try {
      await adminUpdateStatus(uuid, { status: selectedStatus })
      showSuccessToast('상담 상태가 변경되었습니다')
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResponseSubmit = async () => {
    if (!responseMessage.trim()) {
      showErrorToast(null, '답변 내용을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      await adminCreateResponse(uuid, { responseMessage })
      showSuccessToast('답변이 등록되었습니다')
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '답변 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!consultation) return
    if (!confirm(`정말로 "${consultation.name}"의 상담을 삭제하시겠습니까?`)) return

    try {
      await adminDeleteConsultation(uuid)
      showSuccessToast('상담이 삭제되었습니다')
      router.push('/admin/consultations')
    } catch (error) {
      showErrorToast(error, '상담 삭제에 실패했습니다')
    }
  }

  const fetchCompanies = async (keyword?: string) => {
    try {
      const companiesList = await getCompanies(keyword)
      setCompanies(companiesList)
    } catch (error) {
      showErrorToast(error, '업체 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleSearchCompanies = () => {
    fetchCompanies(searchKeyword || undefined)
  }

  const handleAssignCompany = async () => {
    if (!consultation || !selectedCompanyUuid) return
    setIsSubmitting(true)
    try {
      await assignConsultationToCompany(uuid, selectedCompanyUuid)
      showSuccessToast('업체가 배정되었습니다.')
      setShowAssignModal(false)
      fetchConsultation()
    } catch (error) {
      showErrorToast(error, '업체 배정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">상담 내용을 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!consultation) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
          <Link
            href="/admin/consultations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <FiArrowLeft />
            목록으로
          </Link>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FiMessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">상담 내용을 불러올 수 없습니다</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/admin/consultations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 상담 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {consultation.subject || '상담 문의'}
                </h1>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[consultation.status]}`}>
                  {STATUS_LABELS[consultation.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <FiUser className="text-gray-400" />
                <span className="font-medium">이름:</span>
                <span>{consultation.name}</span>
                {consultation.isMember && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary rounded text-xs font-medium">
                    회원
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FiPhone className="text-gray-400" />
                <span className="font-medium">전화번호:</span>
                <span>{consultation.phone}</span>
              </div>
              {consultation.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMail className="text-gray-400" />
                  <span className="font-medium">이메일:</span>
                  <span>{consultation.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <FiClock className="text-gray-400" />
                <span className="font-medium">신청일:</span>
                <span>{new Date(consultation.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* 상담 내용 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiMessageSquare />
              상담 내용
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{consultation.message}</p>
            </div>

            {(consultation.preferredContactMethod || consultation.preferredContactTime) && (
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {consultation.preferredContactMethod && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">선호 연락 방법</p>
                    <p className="text-gray-600">{consultation.preferredContactMethod}</p>
                  </div>
                )}
                {consultation.preferredContactTime && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">선호 연락 시간</p>
                    <p className="text-gray-600">{consultation.preferredContactTime}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 약관 동의 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">약관 동의 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">개인정보 수집 및 이용:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${consultation.personalInfoConsent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {consultation.personalInfoConsent ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">제3자 제공:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${consultation.thirdPartyConsent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {consultation.thirdPartyConsent ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">이용약관:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${consultation.termsOfServiceConsent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {consultation.termsOfServiceConsent ? '동의' : '미동의'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">마케팅 수신:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${consultation.marketingConsent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {consultation.marketingConsent ? '동의' : '미동의'}
                </span>
              </div>
            </div>
          </div>

          {/* 배정 업체 */}
          {consultation.assignedCompanyName && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">배정 업체</h2>
              <p className="text-gray-700">{consultation.assignedCompanyName}</p>
              {consultation.assignedAt && (
                <p className="text-sm text-gray-500 mt-1">
                  배정일: {new Date(consultation.assignedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}

          {/* 취소 정보 */}
          {consultation.status === 'CANCELLED' && consultation.cancellationReason && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
              <h2 className="text-lg font-bold text-red-900 mb-2">취소 사유</h2>
              <p className="text-red-800">{consultation.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 상태 변경 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">상태 관리</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 상태
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ConsultationStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value="SUBMITTED">접수됨</option>
                  <option value="IN_PROGRESS">진행중</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={isSubmitting || selectedStatus === consultation.status}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave />
                상태 변경
              </button>
            </div>
          </div>

          {/* 업체 배정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">업체 배정</h3>
            {consultation.assignedCompanyName && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">현재 배정된 업체</p>
                <p className="font-medium text-gray-900">{consultation.assignedCompanyName}</p>
              </div>
            )}
            <button
              onClick={() => {
                fetchCompanies()
                setShowAssignModal(true)
              }}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <FiUser />
              업체 배정하기
            </button>
          </div>

          {/* 답변 작성 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">답변 작성</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답변 내용
                </label>
                <textarea
                  rows={8}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  placeholder="상담 답변을 입력해주세요..."
                />
              </div>
              <button
                onClick={handleResponseSubmit}
                disabled={isSubmitting || !responseMessage.trim()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave />
                답변 저장
              </button>
            </div>

            {consultation.responseMessage && consultation.respondedAt && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  최종 답변일: {new Date(consultation.respondedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            )}
          </div>

          {/* 삭제 */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">위험 구역</h3>
            <button
              onClick={handleDelete}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              상담 삭제
            </button>
            <p className="text-xs text-gray-500 mt-2">
              삭제된 상담은 복구할 수 없습니다
            </p>
          </div>
        </div>
      </div>

      {/* 업체 배정 모달 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">업체 배정</h3>
            <p className="text-sm text-gray-500 mb-4">배정할 업체를 선택하세요.</p>

            {/* 검색 바 */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchCompanies()}
                placeholder="업체명, 사업자번호, 이메일로 검색..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSearchCompanies}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                검색
              </button>
            </div>

            {/* 업체 목록 */}
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {!companies || companies.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchKeyword ? '검색 결과가 없습니다.' : '업체를 검색하세요.'}
                </div>
              ) : (
                companies.map((company) => (
                  <label
                    key={company.uuid}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCompanyUuid === company.uuid
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="company"
                      value={company.uuid}
                      checked={selectedCompanyUuid === company.uuid}
                      onChange={() => setSelectedCompanyUuid(company.uuid)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{company.name}</div>
                      {company.description && (
                        <div className="text-sm text-gray-600">{company.description}</div>
                      )}
                      <div className="text-sm text-gray-500">
                        {company.primaryPhone} · {company.email}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSearchKeyword('')
                  setSelectedCompanyUuid(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAssignCompany}
                disabled={isSubmitting || selectedCompanyUuid === null}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? '배정 중...' : '배정'}
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
