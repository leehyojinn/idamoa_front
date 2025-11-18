'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import {
  IoSaveOutline,
  IoCloudUploadOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoCalendarOutline,
} from 'react-icons/io5'
import { createEstimateRequest, type CreateEstimateRequest, type EstimateAttachment } from '@/lib/api/estimate'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/Checkbox'
import { formatPhoneNumber } from '@/lib/utils'

export default function EstimateCreateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimateType, setEstimateType] = useState('INTERIOR')
  const [clientName, setClientName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [siteAddress, setSiteAddress] = useState('')
  const [siteCity, setSiteCity] = useState('')
  const [siteState, setSiteState] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [areaPyeong, setAreaPyeong] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [desiredStartDate, setDesiredStartDate] = useState<Date | null>(null)
  const [desiredCompletionDate, setDesiredCompletionDate] = useState<Date | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [attachments, setAttachments] = useState<EstimateAttachment[]>([])
  const [isAddressUndecided, setIsAddressUndecided] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      showErrorToast(null, '제목을 입력해주세요')
      return
    }
    if (!description.trim()) {
      showErrorToast(null, '상세 설명을 입력해주세요')
      return
    }
    if (description.trim().length < 50) {
      showErrorToast(null, '상세 설명은 최소 50자 이상이어야 합니다')
      return
    }

    setIsSubmitting(true)
    try {
      const data: CreateEstimateRequest = {
        title: title.trim(),
        description: description.trim(),
        estimateType,
        clientName: clientName.trim() || undefined,
        businessType: businessType.trim() || undefined,
        siteAddress: siteAddress.trim() || undefined,
        siteCity: siteCity.trim() || undefined,
        siteState: siteState.trim() || undefined,
        areaSqm: areaSqm ? Number(areaSqm) : undefined,
        areaPyeong: areaPyeong ? Number(areaPyeong) : undefined,
        budgetMin: budgetMin ? Number(budgetMin) * 10000 : undefined,
        budgetMax: budgetMax ? Number(budgetMax) * 10000 : undefined,
        desiredStartDate: desiredStartDate ? desiredStartDate.toISOString().split('T')[0] : undefined,
        desiredCompletionDate: desiredCompletionDate ? desiredCompletionDate.toISOString().split('T')[0] : undefined,
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        isPublic: true,
        status: 'PUBLISHED',
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      const result = await createEstimateRequest(data)

      if (result.success && result.data) {
        showSuccessToast('견적 요청이 등록되었습니다')
        router.push(`/estimates/${result.data.uuid}`)
      }
    } catch (error) {
      showErrorToast(error, '견적 요청 등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAreaPyeongChange = (value: string) => {
    setAreaPyeong(value)
    if (value) {
      const sqm = Number(value) * 3.3058
      setAreaSqm(sqm.toFixed(2))
    } else {
      setAreaSqm('')
    }
  }

  const handleAreaSqmChange = (value: string) => {
    setAreaSqm(value)
    if (value) {
      const pyeong = Number(value) / 3.3058
      setAreaPyeong(pyeong.toFixed(2))
    } else {
      setAreaPyeong('')
    }
  }

  // 전화번호 입력 핸들러
  const handleContactPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setContactPhone(formatted)
  }

  // 카카오 주소 검색
  const handleAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum) {
      showErrorToast(null, '주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setSiteAddress(data.address)
        setSiteCity(data.sigungu)
        setSiteState(data.sido)
      },
    }).open()
  }

  // 주소 미정 체크박스 핸들러
  const handleAddressUndecidedChange = (checked: boolean) => {
    setIsAddressUndecided(checked)
    if (checked) {
      setSiteAddress('미정')
      setSiteCity('미정')
      setSiteState('미정')
    } else {
      setSiteAddress('')
      setSiteCity('')
      setSiteState('')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">기본 정보</h2>
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 강남구 사무실 인테리어 견적 요청"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                상세 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="프로젝트에 대한 상세한 설명을 입력해주세요 (최소 50자)"
                required
              />
              <p className="mt-2 text-sm text-gray-500">{description.length} / 50자 이상</p>
            </div>

            {/* Estimate Type */}
            <div>
              <label htmlFor="estimateType" className="block text-sm font-semibold text-gray-700 mb-2">
                견적 유형 <span className="text-red-500">*</span>
              </label>
              <select
                id="estimateType"
                value={estimateType}
                onChange={(e) => setEstimateType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="INTERIOR">인테리어</option>
                <option value="CONSTRUCTION">건축</option>
                <option value="REMODELING">리모델링</option>
                <option value="EXTERIOR">외관</option>
                <option value="OTHER">기타</option>
              </select>
            </div>

            {/* Client Name & Business Type */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 mb-2">
                  의뢰인명
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="회사명 또는 개인명"
                />
              </div>
              <div>
                <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-2">
                  업종
                </label>
                <input
                  type="text"
                  id="businessType"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 카페, 사무실, 주거"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Location & Area */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">위치 및 면적</h2>
          <div className="space-y-6">
            {/* Address Undecided Checkbox */}
            <Checkbox
              checked={isAddressUndecided}
              onChange={handleAddressUndecidedChange}
              label="주소 미정"
              size="sm"
            />

            {/* Site Address */}
            <div>
              <label htmlFor="siteAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                현장 주소
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="siteAddress"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  disabled={isAddressUndecided}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="주소 검색 버튼을 클릭하세요"
                  readOnly
                />
                <Button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isAddressUndecided}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                >
                  <IoSearchOutline className="mr-2" />
                  주소 검색
                </Button>
              </div>
            </div>

            {/* City & State */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteCity" className="block text-sm font-semibold text-gray-700 mb-2">
                  시/구
                </label>
                <input
                  type="text"
                  id="siteCity"
                  value={siteCity}
                  onChange={(e) => setSiteCity(e.target.value)}
                  disabled={isAddressUndecided}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="예: 강남구"
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="siteState" className="block text-sm font-semibold text-gray-700 mb-2">
                  시/도
                </label>
                <input
                  type="text"
                  id="siteState"
                  value={siteState}
                  onChange={(e) => setSiteState(e.target.value)}
                  disabled={isAddressUndecided}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="예: 서울특별시"
                  readOnly
                />
              </div>
            </div>

            {/* Area */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="areaPyeong" className="block text-sm font-semibold text-gray-700 mb-2">
                  면적 (평)
                </label>
                <input
                  type="number"
                  id="areaPyeong"
                  value={areaPyeong}
                  onChange={(e) => handleAreaPyeongChange(e.target.value)}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 30"
                />
              </div>
              <div>
                <label htmlFor="areaSqm" className="block text-sm font-semibold text-gray-700 mb-2">
                  면적 (㎡)
                </label>
                <input
                  type="number"
                  id="areaSqm"
                  value={areaSqm}
                  onChange={(e) => handleAreaSqmChange(e.target.value)}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 99.17"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Schedule */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">예산 및 일정</h2>
          <div className="space-y-6">
            {/* Budget */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-semibold text-gray-700 mb-2">
                  최소 예산 (만원)
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 3000"
                />
              </div>
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-semibold text-gray-700 mb-2">
                  최대 예산 (만원)
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 5000"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="desiredStartDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  희망 시작일
                </label>
                <div className="relative">
                  <DatePicker
                    selected={desiredStartDate}
                    onChange={(date) => setDesiredStartDate(date)}
                    locale={ko}
                    dateFormat="yyyy년 MM월 dd일"
                    placeholderText="날짜를 선택하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    wrapperClassName="w-full"
                  />
                  <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="desiredCompletionDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  희망 완료일
                </label>
                <div className="relative">
                  <DatePicker
                    selected={desiredCompletionDate}
                    onChange={(date) => setDesiredCompletionDate(date)}
                    locale={ko}
                    dateFormat="yyyy년 MM월 dd일"
                    placeholderText="날짜를 선택하세요"
                    minDate={desiredStartDate || undefined}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    wrapperClassName="w-full"
                  />
                  <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-semibold text-gray-700 mb-2">
                  제출 마감일시
                </label>
                <div className="relative">
                  <DatePicker
                    selected={expiresAt}
                    onChange={(date) => setExpiresAt(date)}
                    locale={ko}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    dateFormat="yyyy년 MM월 dd일 HH:mm"
                    placeholderText="날짜와 시간을 선택하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    wrapperClassName="w-full"
                  />
                  <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">연락처 정보</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold text-gray-700 mb-2">
                담당자명
              </label>
              <input
                type="text"
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => handleContactPhoneChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-1234-5678"
                maxLength={13}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <IoCloudUploadOutline className="mr-2" />
            {isSubmitting ? '등록 중...' : '견적 요청 등록'}
          </Button>
        </div>
      </form>
    </div>
  )
}
