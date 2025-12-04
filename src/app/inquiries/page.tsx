'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  createGeneralInquiry,
  GENERAL_INQUIRY_TYPE_LABELS,
  type GeneralInquiryType,
  type CreateGeneralInquiryRequest
} from '@/lib/api/inquiry'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Select from '@/components/ui/Select'
import { FiMessageSquare, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

export default function GeneralInquiryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CreateGeneralInquiryRequest>({
    inquiryType: 'OTHER',
    title: '',
    content: '',
    fileUuids: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
    } else if (formData.title.length > 200) {
      newErrors.title = '제목은 200자 이하여야 합니다.'
    }

    if (!formData.content.trim()) {
      newErrors.content = '문의내용을 입력해주세요.'
    } else if (formData.content.length < 10) {
      newErrors.content = '문의내용은 10자 이상 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await createGeneralInquiry(formData)
      if (result.success) {
        showSuccessToast('문의가 성공적으로 접수되었습니다.')
        router.push('/inquiries/my')
      }
    } catch (error) {
      showErrorToast(error, '문의 접수에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-2xl min-h-[calc(100vh-64px-200px)]">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">로그인이 필요한 서비스입니다</h2>
            <p className="text-gray-600 mb-8">
              일반 문의는 로그인 후 이용하실 수 있습니다.<br />
              로그인하시면 문의 내역 확인 및 관리가 가능합니다.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              로그인하기
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiMessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">일반 문의</h1>
              <p className="text-gray-600 text-sm mt-1">
                궁금하신 사항을 남겨주시면 빠르게 답변드리겠습니다
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 정보 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
              문의 정보
            </h2>

            <div className="space-y-5">
              {/* 문의 유형 */}
              <div>
                <Select
                  label="문의 유형"
                  options={(Object.keys(GENERAL_INQUIRY_TYPE_LABELS) as GeneralInquiryType[]).map((type) => ({
                    value: type,
                    label: GENERAL_INQUIRY_TYPE_LABELS[type],
                  }))}
                  value={formData.inquiryType}
                  onChange={(value) => setFormData(prev => ({ ...prev, inquiryType: value as GeneralInquiryType }))}
                  placeholder="문의 유형을 선택해주세요"
                />
                <p className="mt-2 text-sm text-gray-500">
                  문의 유형을 정확히 선택하시면 더 빠른 답변이 가능합니다
                </p>
              </div>

              {/* 제목 */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={200}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="문의 제목을 입력해주세요"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">{formData.title.length} / 200자</p>
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
              문의 내용
            </h2>

            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                  errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="문의하실 내용을 자세히 입력해주세요. (10자 이상)&#10;&#10;• 문제가 발생한 상황&#10;• 오류 메시지 (있는 경우)&#10;• 기타 참고사항"
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.content}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">{formData.content.length}자</p>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex gap-3">
              <FiCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-1">
                <p className="font-semibold mb-2">답변 안내</p>
                <ul className="space-y-1 ml-1">
                  <li>• 답변은 영업일 기준 1-2일 이내에 등록됩니다</li>
                  <li>• 답변이 등록되면 알림으로 안내해드립니다</li>
                  <li>• 답변 등록 전까지는 문의를 수정/삭제하실 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3.5 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  접수 중...
                </span>
              ) : '문의하기'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}
