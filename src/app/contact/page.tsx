'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createPartnershipInquiry, PARTNERSHIP_TYPE_LABELS, type PartnershipType, type CreatePartnershipInquiryRequest } from '@/lib/api/inquiry'
import { getProfile } from '@/lib/api/profile'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatPhoneNumber } from '@/lib/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Select from '@/components/ui/Select'

export default function InquiryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CreatePartnershipInquiryRequest>({
    partnershipType: 'PARTNERSHIP',
    name: '',
    email: '',
    phone: '',
    content: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 로그인한 사용자의 프로필 정보 자동 채우기
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        const response = await getProfile()
        if (response.success && response.data) {
          setFormData(prev => ({
            ...prev,
            name: response.data?.name || '',
            phone: formatPhoneNumber(response.data?.phone || ''),
            email: response.data?.email || '',
          }))
        }
      } catch (error) {
        console.error('프로필 정보 로드 실패:', error)
      }
    }

    loadProfileData()
  }, [user])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    // 전화번호 필드인 경우 자동 포맷팅
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        phone: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // 입력 시 해당 필드 에러 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '작성자명을 입력해주세요.'
    } else if (formData.name.length > 100) {
      newErrors.name = '작성자명은 100자 이하여야 합니다.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    } else if (formData.email.length > 100) {
      newErrors.email = '이메일은 100자 이하여야 합니다.'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.'
    } else if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
    }

    if (!formData.content.trim()) {
      newErrors.content = '문의내용을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await createPartnershipInquiry(formData)
      if (result.success) {
        showSuccessToast('문의가 성공적으로 접수되었습니다.')
        router.push('/')
      }
    } catch (error) {
      showErrorToast(error, '문의 접수에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[calc(100vh-64px-200px)]">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">제휴/광고 문의</h1>
        <p className="text-gray-600 mb-8">
          제휴 및 광고 문의를 남겨주시면 담당자가 확인 후 연락드리겠습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* 문의 유형 */}
            <Select
              label="문의 유형 *"
              options={(Object.keys(PARTNERSHIP_TYPE_LABELS) as PartnershipType[]).map((type) => ({
                value: type,
                label: PARTNERSHIP_TYPE_LABELS[type],
              }))}
              value={formData.partnershipType}
              onChange={(value) => setFormData(prev => ({ ...prev, partnershipType: value as PartnershipType }))}
              placeholder="문의 유형을 선택해주세요"
            />

            {/* 작성자명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                작성자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-1234-5678"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              <p className="mt-1 text-sm text-gray-500">숫자만 입력하시면 자동으로 하이픈이 추가됩니다</p>
            </div>

            {/* 문의내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                문의내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="문의하실 내용을 자세히 입력해주세요."
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '접수 중...' : '문의하기'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}
