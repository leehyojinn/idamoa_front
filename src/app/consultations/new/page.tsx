'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createConsultation } from '@/lib/api/consultation'
import { getProfile } from '@/lib/api/profile'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatPhoneNumber } from '@/lib/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Checkbox from '@/components/ui/Checkbox'
import type { CreateConsultationRequest } from '@/types/consultation'

export default function ConsultationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // 프로필에서 가져온 약관 동의 정보 (이미 동의한 항목)
  const [profileConsents, setProfileConsents] = useState({
    personalInfoConsent: false, // privacyAgreed
    termsOfServiceConsent: false, // termsAgreed
    marketingConsent: false, // marketingAgreed
  })

  const [formData, setFormData] = useState<CreateConsultationRequest>({
    name: '',
    phone: '',
    email: '',
    password: '',
    subject: '',
    message: '',
    preferredContactMethod: '',
    preferredContactTime: '',
    personalInfoConsent: false,
    thirdPartyConsent: false,
    termsOfServiceConsent: false,
    marketingConsent: false,
    consentVersion: 'v1.0'
  })

  // 로그인한 사용자의 프로필 정보 자동 채우기
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      setIsLoadingProfile(true)
      try {
        const response = await getProfile()
        if (response.success && response.data) {
          // 약관 동의 정보 저장 (프로필 API 필드명 매핑)
          const consents = {
            personalInfoConsent: response.data?.privacyAgreed || false,
            termsOfServiceConsent: response.data?.termsAgreed || false,
            marketingConsent: response.data?.marketingAgreed || false,
          }
          setProfileConsents(consents)

          setFormData(prev => ({
            ...prev,
            name: response.data?.name || '',
            phone: formatPhoneNumber(response.data?.phone || ''),
            email: response.data?.email || '',
            // 약관 동의 정보 자동 채우기
            ...consents,
          }))
        }
      } catch (error) {
        console.error('프로필 정보 로드 실패:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfileData()
  }, [user])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target

    // 전화번호 필드인 경우 자동 포맷팅
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        phone: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  // 미동의한 약관 목록 (로그인 시)
  const pendingConsents = user ? {
    personalInfoConsent: !profileConsents.personalInfoConsent,
    termsOfServiceConsent: !profileConsents.termsOfServiceConsent,
    marketingConsent: !profileConsents.marketingConsent,
  } : {
    personalInfoConsent: true,
    termsOfServiceConsent: true,
    marketingConsent: true,
  }

  // 표시할 약관이 있는지 확인
  const hasAnyPendingConsents = Object.values(pendingConsents).some(v => v)

  // 전체 동의 체크 상태 (미동의한 약관 중에서)
  const isAllPendingConsentsChecked =
    (!pendingConsents.personalInfoConsent || formData.personalInfoConsent) &&
    (!pendingConsents.termsOfServiceConsent || formData.termsOfServiceConsent) &&
    (!pendingConsents.marketingConsent || formData.marketingConsent)

  // 전체 동의 핸들러 (미동의한 약관만)
  const handleAllConsents = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personalInfoConsent: pendingConsents.personalInfoConsent ? checked : prev.personalInfoConsent,
      termsOfServiceConsent: pendingConsents.termsOfServiceConsent ? checked : prev.termsOfServiceConsent,
      marketingConsent: pendingConsents.marketingConsent ? checked : prev.marketingConsent,
    }))
  }

  // 개별 동의 핸들러
  const handleConsentChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 동의 체크
    if (!formData.personalInfoConsent || !formData.termsOfServiceConsent) {
      showErrorToast(null, '필수 동의 항목을 모두 체크해주세요')
      return
    }

    // 비밀번호 필수 (회원/비회원 모두)
    if (!formData.password || formData.password.length !== 4) {
      showErrorToast(null, '4자리 비밀번호를 입력해주세요')
      return
    }

    // 메시지 길이 체크
    if (formData.message.length < 10 || formData.message.length > 5000) {
      showErrorToast(null, '상담 내용은 10자 이상 5000자 이하여야 합니다')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createConsultation(formData)
      if (result.success && result.data) {
        showSuccessToast('상담 신청이 완료되었습니다')
        router.push(`/consultations/${result.data.uuid}`)
      }
    } catch (error) {
      showErrorToast(error, '상담 신청에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">빠른상담 신청</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 신청자 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">신청자 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-1234-5678"
              />
              <p className="mt-1 text-sm text-gray-500">숫자만 입력하시면 자동으로 하이픈이 추가됩니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                name="email"
                maxLength={255}
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="hong@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4자리 비밀번호 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(상담 조회 시 필요)</span>
              </label>
              <input
                type="password"
                name="password"
                required
                maxLength={4}
                pattern="\d{4}"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234"
              />
              <p className="mt-1 text-sm text-gray-500">
                {user
                  ? '로그아웃 상태에서도 상담 내용을 조회할 수 있습니다'
                  : '상담 내용 조회 시 사용됩니다'}
              </p>
            </div>
          </div>
        </div>

        {/* 상담 내용 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">상담 내용</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                name="subject"
                maxLength={200}
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="인테리어 견적 문의드립니다"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상담 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={8}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="상담 내용을 자세히 입력해주세요 (10자 이상)"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.message.length} / 5,000자
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호 연락 방법
              </label>
              <input
                type="text"
                name="preferredContactMethod"
                maxLength={20}
                value={formData.preferredContactMethod}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="전화, 이메일, 문자 등"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호 연락 시간
              </label>
              <input
                type="text"
                name="preferredContactTime"
                maxLength={100}
                value={formData.preferredContactTime}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="오전 10시~12시"
              />
            </div>
          </div>
        </div>

        {/* 약관 동의 */}
        {hasAnyPendingConsents && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">약관 동의</h2>

            <div className="space-y-4">
              {/* 전체 동의 */}
              <div className="pb-4 border-b border-gray-200">
                <Checkbox
                  checked={isAllPendingConsentsChecked}
                  onChange={handleAllConsents}
                  label="전체 동의"
                  size="md"
                />
              </div>

              {/* 개별 동의 */}
              <div className="space-y-3 pt-2">
                {pendingConsents.personalInfoConsent && (
                  <Checkbox
                    checked={formData.personalInfoConsent}
                    onChange={(checked) => handleConsentChange('personalInfoConsent', checked)}
                    label="개인정보 수집 및 이용 동의 (필수)"
                    size="sm"
                  />
                )}

                {pendingConsents.termsOfServiceConsent && (
                  <Checkbox
                    checked={formData.termsOfServiceConsent}
                    onChange={(checked) => handleConsentChange('termsOfServiceConsent', checked)}
                    label="이용약관 동의 (필수)"
                    size="sm"
                  />
                )}

                {pendingConsents.marketingConsent && (
                  <Checkbox
                    checked={formData.marketingConsent}
                    onChange={(checked) => handleConsentChange('marketingConsent', checked)}
                    label="마케팅 수신 동의 (선택)"
                    size="sm"
                  />
                )}
              </div>
            </div>
          </div>
        )}

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
            {isSubmitting ? '신청 중...' : '상담 신청하기'}
          </button>
        </div>
      </form>
      </div>
      <Footer />
    </>
  )
}
