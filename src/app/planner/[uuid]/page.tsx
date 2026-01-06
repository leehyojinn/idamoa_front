'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getPublicPlannerApplication,
  STATUS_LABELS,
  STATUS_COLORS,
  CONSULTATION_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type PlannerApplicationPublicDetailResponse,
} from '@/lib/api/planner'
import { showErrorToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PlannerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [application, setApplication] = useState<PlannerApplicationPublicDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchApplication = async () => {
      if (!uuid) return

      setIsLoading(true)
      try {
        const response = await getPublicPlannerApplication(uuid)
        if (response.success) {
          setApplication(response.data)
        }
      } catch (error) {
        showErrorToast(error, '신청서를 불러오는데 실패했습니다.')
        router.push('/planner')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [uuid, router])

  // 이름 마스킹
  const maskName = (name: string) => {
    if (name.length <= 1) return name
    if (name.length === 2) return name[0] + '*'
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
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
          <div className="text-center py-20">
            <p className="text-gray-500">신청서를 찾을 수 없습니다.</p>
            <Link href="/planner" className="mt-4 inline-block text-primary hover:underline">
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
            href="/planner"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
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
            <span>신청자: {maskName(application.applicantName)}</span>
            <span>|</span>
            <span>신청일: {new Date(application.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
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
                    className="px-3 py-1 bg-primary-100 text-primary text-sm rounded-full"
                  >
                    {REQUEST_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 사업장 정보 (업종/면적만 표시 - 사업장명, 주소는 작성자만 열람 가능) */}
        {(application.businessAreaSize || application.businessType) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">사업장 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
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
                  <span className="text-primary hover:underline">{file.fileName}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Link
            href="/planner"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            목록으로
          </Link>
          <Link
            href="/planner/my"
            className="px-6 py-3 border border-primary text-primary font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            내 신청현황 보기
          </Link>
          <Link
            href="/planner/create"
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-800 transition-colors"
          >
            상담 신청하기
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
