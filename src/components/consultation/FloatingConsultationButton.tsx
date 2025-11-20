'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { createConsultation } from '@/lib/api/consultation'
import { getProfile } from '@/lib/api/profile'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatPhoneNumber } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import Checkbox from '@/components/ui/Checkbox'
import type { CreateConsultationRequest } from '@/types/consultation'

export default function FloatingConsultationButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const { user } = useAuth()

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

  useEffect(() => {
    setMounted(true)

    // 초기 모바일 체크 (1024px 미만)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

    if (isOpen) {
      loadProfileData()
    }
  }, [user, isOpen])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        setIsOpen(false)
        setShowOptional(false)
        // 폼 초기화
        setFormData({
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
      }
    } catch (error) {
      showErrorToast(error, '상담 신청에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const dialog = mounted && (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? '100%' : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? '100%' : 20 }}
            className={`bg-white shadow-2xl overflow-y-auto ${
              isMobile
                ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[95vh]'
                : 'fixed w-full max-w-lg rounded-lg max-h-[90vh]'
            }`}
            style={{
              position: 'fixed',
              bottom: isMobile ? '0' : '88px',
              right: isMobile ? '0' : '24px',
              left: isMobile ? '0' : 'auto',
              zIndex: 60
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              {/* 모바일 드래그 핸들 */}
              {isMobile && (
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">빠른상담 신청</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="닫기"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={isMobile ? 'p-4 pb-8 space-y-3' : 'p-4 space-y-3'}>
              {/* 기본 정보 - 2열 그리드 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  4자리 비밀번호 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-1">(상담 조회용)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="1234"
                />
              </div>

              {/* 상담 내용 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={3}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  placeholder="상담 내용을 입력해주세요 (10자 이상)"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {formData.message.length} / 5,000
                </p>
              </div>

              {/* 추가 정보 접기/펼치기 */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                >
                  {showOptional ? '추가 정보 숨기기 ▲' : '추가 정보 입력 ▼'}
                </button>

                {showOptional && (
                  <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        제목
                      </label>
                      <input
                        type="text"
                        name="subject"
                        maxLength={200}
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="인테리어 견적 문의"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        이메일
                      </label>
                      <input
                        type="email"
                        name="email"
                        maxLength={255}
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="hong@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          선호 연락 방법
                        </label>
                        <input
                          type="text"
                          name="preferredContactMethod"
                          maxLength={20}
                          value={formData.preferredContactMethod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="전화"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          선호 연락 시간
                        </label>
                        <input
                          type="text"
                          name="preferredContactTime"
                          maxLength={100}
                          value={formData.preferredContactTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="오전 10시"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 약관 동의 - 간소화 */}
              {hasAnyPendingConsents && (
                <div className="pt-2 border-t border-gray-200">
                  {/* 전체 동의만 크게 표시 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Checkbox
                      checked={isAllPendingConsentsChecked}
                      onChange={handleAllConsents}
                      label="필수 약관 전체 동의"
                      size="sm"
                    />
                  </div>

                  {/* 개별 약관은 작게 표시 */}
                  <div className="mt-2 space-y-1 text-xs text-gray-600 pl-2">
                    {pendingConsents.personalInfoConsent && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.personalInfoConsent}
                          onChange={(e) => handleConsentChange('personalInfoConsent', e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span>개인정보 수집·이용 (필수)</span>
                      </label>
                    )}

                    {pendingConsents.termsOfServiceConsent && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.termsOfServiceConsent}
                          onChange={(e) => handleConsentChange('termsOfServiceConsent', e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span>이용약관 (필수)</span>
                      </label>
                    )}

                    {pendingConsents.marketingConsent && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.marketingConsent}
                          onChange={(e) => handleConsentChange('marketingConsent', e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span>마케팅 수신 (선택)</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    신청 중...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    상담 신청하기
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors ${
          isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="빠른상담 신청"
      >
        <FiMessageCircle className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
      </motion.button>

      {/* 다이얼로그 - Portal로 렌더링 */}
      {dialog && createPortal(dialog, document.body)}
    </>
  )
}
