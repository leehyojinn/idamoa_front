'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { format } from 'date-fns'
import { IoCalendarOutline, IoCheckmarkCircle } from 'react-icons/io5'
import { FiPhone, FiMail, FiUser, FiMapPin, FiHome, FiGrid, FiBriefcase } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import {
  createPlannerApplication,
  CONSULTATION_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type ConsultationMethod,
  type RequestType,
  type PreferredDate,
  type PlannerApplicationCreateRequest,
} from '@/lib/api/planner'
import { getProfile } from '@/lib/api/profile'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { formatPhoneNumber } from '@/lib/utils'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useKakaoAddress } from '@/hooks/useKakaoAddress'

export default function PlannerCreatePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { openAddressSearch } = useKakaoAddress()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 로그인 체크
  useEffect(() => {
    if (!isAuthenticated) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push(`/login?returnUrl=${encodeURIComponent('/planner/create')}`)
    }
  }, [isAuthenticated, router])

  const [formData, setFormData] = useState<PlannerApplicationCreateRequest>({
    title: '',
    content: '',
    consultationMethod: 'VISIT',
    requestTypes: [],
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    businessName: '',
    businessAddress: '',
    businessAreaSize: '',
    businessType: '',
    attachmentFileIds: [],
    preferredDates: [{ priority: 1, preferredDate: '', preferredTime: '' }],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 필수 입력 필드 refs
  const titleRef = useRef<HTMLInputElement>(null)
  const requestTypesRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const applicantNameRef = useRef<HTMLInputElement>(null)
  const applicantPhoneRef = useRef<HTMLInputElement>(null)
  const applicantEmailRef = useRef<HTMLInputElement>(null)
  const preferredDatesRef = useRef<HTMLDivElement>(null)

  // 로그인한 사용자의 프로필 정보 자동 채우기
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        const response = await getProfile()
        if (response.success && response.data) {
          setFormData((prev) => ({
            ...prev,
            applicantName: response.data?.name || '',
            applicantPhone: formatPhoneNumber(response.data?.phone || ''),
            applicantEmail: response.data?.email || '',
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

    if (name === 'applicantPhone') {
      setFormData((prev) => ({
        ...prev,
        applicantPhone: formatPhoneNumber(value),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleRequestTypeToggle = (type: RequestType) => {
    setFormData((prev) => ({
      ...prev,
      requestTypes: prev.requestTypes.includes(type)
        ? prev.requestTypes.filter((t) => t !== type)
        : [...prev.requestTypes, type],
    }))
    if (errors.requestTypes) {
      setErrors((prev) => ({ ...prev, requestTypes: '' }))
    }
  }

  const handlePreferredDateChange = (
    index: number,
    field: keyof PreferredDate,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newDates = [...prev.preferredDates]
      newDates[index] = { ...newDates[index], [field]: value }
      return { ...prev, preferredDates: newDates }
    })
  }

  const addPreferredDate = () => {
    if (formData.preferredDates.length >= 3) return
    setFormData((prev) => ({
      ...prev,
      preferredDates: [
        ...prev.preferredDates,
        { priority: prev.preferredDates.length + 1, preferredDate: '', preferredTime: '' },
      ],
    }))
  }

  const removePreferredDate = (index: number) => {
    if (formData.preferredDates.length <= 1) return
    setFormData((prev) => {
      const newDates = prev.preferredDates
        .filter((_, i) => i !== index)
        .map((date, i) => ({ ...date, priority: i + 1 }))
      return { ...prev, preferredDates: newDates }
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let firstErrorRef: React.RefObject<HTMLElement | null> | null = null

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = titleRef
    } else if (formData.title.length > 200) {
      newErrors.title = '제목은 200자 이하여야 합니다.'
      if (!firstErrorRef) firstErrorRef = titleRef
    }

    if (formData.requestTypes.length === 0) {
      newErrors.requestTypes = '요청 내용을 최소 1개 이상 선택해주세요.'
      if (!firstErrorRef) firstErrorRef = requestTypesRef
    }

    if (!formData.content.trim()) {
      newErrors.content = '상세 내용을 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = contentRef
    }

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = '성함을 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = applicantNameRef
    }

    if (!formData.applicantPhone.trim()) {
      newErrors.applicantPhone = '연락처를 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = applicantPhoneRef
    } else if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.applicantPhone)) {
      newErrors.applicantPhone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
      if (!firstErrorRef) firstErrorRef = applicantPhoneRef
    }

    if (!formData.applicantEmail.trim()) {
      newErrors.applicantEmail = '이메일을 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = applicantEmailRef
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicantEmail)) {
      newErrors.applicantEmail = '올바른 이메일 형식이 아닙니다.'
      if (!firstErrorRef) firstErrorRef = applicantEmailRef
    }

    const hasEmptyDate = formData.preferredDates.some(
      (date) => !date.preferredDate || !date.preferredTime
    )
    if (hasEmptyDate) {
      newErrors.preferredDates = '모든 희망 일정을 입력해주세요.'
      if (!firstErrorRef) firstErrorRef = preferredDatesRef
    }

    setErrors(newErrors)

    // 첫 번째 에러 필드로 스크롤 및 포커스
    if (firstErrorRef?.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // input/textarea는 focus 가능, div는 스크롤만
      if ('focus' in firstErrorRef.current && typeof firstErrorRef.current.focus === 'function') {
        setTimeout(() => {
          (firstErrorRef.current as HTMLInputElement | HTMLTextAreaElement)?.focus()
        }, 300)
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다.')
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createPlannerApplication(formData)
      if (result.success) {
        showSuccessToast('플래너 상담 신청이 완료되었습니다.')
        router.push('/planner/my')
      }
    } catch (error) {
      showErrorToast(error, '신청서 접수에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
        {/* 페이지 헤더 */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            전문 상담 서비스
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">플래너 상담 신청</h1>
          <p className="text-gray-500 text-lg">
            인테리어/창업 관련 전문 상담을 신청해주세요.<br className="hidden sm:block" />
            담당 플래너가 빠르게 연락드리겠습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">상담 정보</h2>
            </div>

            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 강남역 근처 카페 인테리어 상담 요청"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* 상담 방법 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                상담 방법 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(CONSULTATION_METHOD_LABELS) as ConsultationMethod[]).map((method) => (
                  <label
                    key={method}
                    className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.consultationMethod === method
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="consultationMethod"
                      value={method}
                      checked={formData.consultationMethod === method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultationMethod: e.target.value as ConsultationMethod,
                        })
                      }
                      className="sr-only"
                    />
                    <span className="font-medium">{CONSULTATION_METHOD_LABELS[method]}</span>
                    {formData.consultationMethod === method && (
                      <IoCheckmarkCircle className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* 요청 내용 */}
            <div ref={requestTypesRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                요청 내용 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2 text-xs">(다중 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleRequestTypeToggle(type)}
                    className={`px-4 py-2.5 rounded-full border-2 font-medium transition-all ${
                      formData.requestTypes.includes(type)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {formData.requestTypes.includes(type) && (
                      <IoCheckmarkCircle className="inline-block w-4 h-4 mr-1 -mt-0.5" />
                    )}
                    {REQUEST_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {errors.requestTypes && (
                <p className="mt-2 text-sm text-red-600">{errors.requestTypes}</p>
              )}
            </div>

            {/* 상세 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={contentRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="상담받고 싶은 내용을 자세히 작성해주세요."
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            </div>
          </div>

          {/* 신청자 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">신청자 정보</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="applicantName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  성함 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={applicantNameRef}
                    type="text"
                    id="applicantName"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="홍길동"
                  />
                </div>
                {errors.applicantName && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicantName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="applicantPhone"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  연락처 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={applicantPhoneRef}
                    type="tel"
                    id="applicantPhone"
                    name="applicantPhone"
                    value={formData.applicantPhone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="010-1234-5678"
                  />
                </div>
                {errors.applicantPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicantPhone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="applicantEmail"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={applicantEmailRef}
                    type="email"
                    id="applicantEmail"
                    name="applicantEmail"
                    value={formData.applicantEmail}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                  />
                </div>
                {errors.applicantEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicantEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* 사업장 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">사업장 정보</h2>
                <p className="text-sm text-gray-400">선택사항</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  사업장명
                </label>
                <div className="relative">
                  <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="예: 서울내과의원"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="businessAreaSize"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  면적
                </label>
                <div className="relative">
                  <FiGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="businessAreaSize"
                    name="businessAreaSize"
                    value={formData.businessAreaSize}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="예: 30평"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="businessType"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  업종/진료과목
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="예: 내과, 피부과"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="businessAddress"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  주소
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="businessAddress"
                      value={formData.businessAddress}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="주소 검색을 클릭하세요"
                      onClick={() =>
                        openAddressSearch((data) => {
                          setFormData((prev) => ({ ...prev, businessAddress: data.address }))
                        })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openAddressSearch((data) => {
                        setFormData((prev) => ({ ...prev, businessAddress: data.address }))
                      })
                    }
                    className="px-5 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap font-medium"
                  >
                    주소 검색
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 희망 일정 */}
          <div ref={preferredDatesRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  희망 상담 일정 <span className="text-red-500">*</span>
                </h2>
              </div>
              {formData.preferredDates.length < 3 && (
                <button
                  type="button"
                  onClick={addPreferredDate}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                >
                  + 일정 추가
                </button>
              )}
            </div>

            <div className="space-y-4">
              {formData.preferredDates.map((date, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-gray-50 rounded-xl"
                >
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    {date.priority}순위
                  </span>
                  <div className="relative flex-1 w-full sm:w-auto">
                    <IoCalendarOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                    <DatePicker
                      selected={date.preferredDate ? new Date(date.preferredDate) : null}
                      onChange={(selectedDate) =>
                        handlePreferredDateChange(
                          index,
                          'preferredDate',
                          selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
                        )
                      }
                      locale={ko}
                      dateFormat="yyyy년 MM월 dd일"
                      placeholderText="날짜를 선택하세요"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      wrapperClassName="w-full"
                    />
                  </div>
                  <input
                    type="text"
                    value={date.preferredTime}
                    onChange={(e) =>
                      handlePreferredDateChange(index, 'preferredTime', e.target.value)
                    }
                    className="w-full sm:w-36 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="오전 10시"
                  />
                  {formData.preferredDates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePreferredDate(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.preferredDates && (
              <p className="text-sm text-red-600">{errors.preferredDates}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 px-6 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  신청 중...
                </span>
              ) : (
                '상담 신청하기'
              )}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}
