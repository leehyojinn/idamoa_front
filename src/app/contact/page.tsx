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
import FeaturedPartnerships from '@/components/partnership/FeaturedPartnerships'

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
        showErrorToast(error, '프로필 정보를 불러오는데 실패했습니다')
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-900 to-purple-900 py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            인테리어 다모아와<br />
            <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
              함께 성장하세요
            </span>
          </h1>
          <p className="text-xl text-primary-100/90 max-w-2xl mx-auto">
            제휴 및 광고 문의를 통해 새로운 비즈니스 기회를 만들어보세요.
          </p>
        </div>
      </section>

      {/* 제휴 업체 슬라이드 */}
      <FeaturedPartnerships count={8} />

      {/* 문의 폼 섹션 */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">문의하기</h2>
            <p className="text-gray-600">
              아래 양식을 작성해주시면 담당자가 빠르게 연락드리겠습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
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
                className="flex-1 py-3 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '접수 중...' : '문의하기'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 혜택 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">파트너 혜택</h2>
            <p className="text-gray-600">인테리어 다모아 파트너로서 다양한 혜택을 누리세요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 혜택 1 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">브랜드 노출</h3>
              <p className="text-gray-600">
                메인 페이지 및 검색 결과에 우선 노출되어<br />
                더 많은 고객에게 도달할 수 있습니다.
              </p>
            </div>

            {/* 혜택 2 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">타겟 마케팅</h3>
              <p className="text-gray-600">
                인테리어에 관심 있는 잠재 고객에게<br />
                직접적으로 다가갈 수 있습니다.
              </p>
            </div>

            {/* 혜택 3 */}
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">신뢰도 향상</h3>
              <p className="text-gray-600">
                공식 제휴업체 인증 뱃지를 통해<br />
                고객에게 신뢰감을 줄 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
