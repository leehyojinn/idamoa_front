'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { IoSaveOutline, IoCloseCircleOutline, IoCalendarOutline } from 'react-icons/io5'
import { updateProposal, type Proposal, type UpdateProposalRequest, type ProposalAttachment } from '@/lib/api/proposal'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import FileUpload, { type FileAttachment } from '@/components/ui/FileUpload'
import { uploadFile } from '@/lib/api/file'

// 천단위 콤마 추가
const formatNumber = (value: string): string => {
  const number = value.replace(/[^\d]/g, '')
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 콤마 제거하고 숫자만 추출
const parseNumber = (value: string): string => {
  return value.replace(/[^\d]/g, '')
}

interface ProposalEditFormProps {
  proposal: Proposal
}

export default function ProposalEditForm({ proposal }: ProposalEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 기본 정보
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [validUntil, setValidUntil] = useState<Date | null>(null)
  const [proposedStartDate, setProposedStartDate] = useState<Date | null>(null)
  const [proposedEndDate, setProposedEndDate] = useState<Date | null>(null)

  // 가격 상세
  const [pricingDetails, setPricingDetails] = useState<Record<string, number>>({})
  const [pricingKey, setPricingKey] = useState('')
  const [pricingValue, setPricingValue] = useState('')

  // 일정 정보
  const [timeline, setTimeline] = useState<Record<string, string>>({})
  const [timelineKey, setTimelineKey] = useState('')
  const [timelineValue, setTimelineValue] = useState('')

  // 첨부파일
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // 기존 데이터로 초기화
  useEffect(() => {
    setTitle(proposal.title)
    setDescription(proposal.description)
    setPrice(proposal.price.toString())
    setValidUntil(proposal.validUntil ? new Date(proposal.validUntil) : null)
    setProposedStartDate(proposal.proposedStartDate ? new Date(proposal.proposedStartDate) : null)
    setProposedEndDate(proposal.proposedEndDate ? new Date(proposal.proposedEndDate) : null)
    setPricingDetails(proposal.pricingDetails || {})
    setTimeline(proposal.timeline || {})
    setAttachments(
      proposal.attachments?.map((att, index) => ({
        id: att.id,
        fileUuid: att.fileUuid,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileDescription: att.fileDescription,
        displayOrder: att.displayOrder ?? index,
        originalFilename: att.originalFilename,
        mimeType: att.mimeType,
        fileSize: att.fileSize,
      })) || []
    )
  }, [proposal])

  const handleAddPricing = () => {
    if (pricingKey && pricingValue) {
      setPricingDetails({ ...pricingDetails, [pricingKey]: parseInt(pricingValue) })
      setPricingKey('')
      setPricingValue('')
    }
  }

  const handleRemovePricing = (key: string) => {
    const newDetails = { ...pricingDetails }
    delete newDetails[key]
    setPricingDetails(newDetails)
  }

  const handleAddTimeline = () => {
    if (timelineKey && timelineValue) {
      setTimeline({ ...timeline, [timelineKey]: timelineValue })
      setTimelineKey('')
      setTimelineValue('')
    }
  }

  const handleRemoveTimeline = (key: string) => {
    const newTimeline = { ...timeline }
    delete newTimeline[key]
    setTimeline(newTimeline)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!title.trim()) {
      showErrorToast(null, '제안 제목을 입력하세요')
      return
    }

    if (!description.trim()) {
      showErrorToast(null, '제안 설명을 입력하세요')
      return
    }

    if (!price || parseInt(price) < 0) {
      showErrorToast(null, '올바른 제안 금액을 입력하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 파일이 변경되었는지 확인 (새 파일 추가 또는 파일 삭제)
      const hasNewFiles = attachments.some(att => att.file)
      const originalFileCount = proposal.attachments?.length || 0
      const currentFileCount = attachments.length
      const filesChanged = hasNewFiles || (originalFileCount !== currentFileCount)

      // 파일 업로드 처리
      let uploadedAttachments: ProposalAttachment[] | undefined = undefined

      if (filesChanged) {
        uploadedAttachments = []
        for (const att of attachments) {
          if (att.file) {
            // 새 파일 업로드
            try {
              const result = await uploadFile(att.file, 'OTHER')
              uploadedAttachments.push({
                fileUuid: result.uuid,
                fileType: att.fileType,
                fileDescription: att.fileDescription,
                displayOrder: att.displayOrder,
              })
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || error?.message || '알 수 없는 오류'
              throw new Error(`파일 업로드 실패 (${att.originalFilename}): ${errorMsg}`)
            }
          }
          // 기존 파일은 무시 (새 파일만 업로드)
        }
      }

      const data: UpdateProposalRequest = {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price),
        validUntil: validUntil ? validUntil.toISOString() : undefined,
        proposedStartDate: proposedStartDate ? proposedStartDate.toISOString() : undefined,
        proposedEndDate: proposedEndDate ? proposedEndDate.toISOString() : undefined,
        pricingDetails: Object.keys(pricingDetails).length > 0 ? pricingDetails : undefined,
        timeline: Object.keys(timeline).length > 0 ? timeline : undefined,
        ...(filesChanged ? { attachments: uploadedAttachments } : {}),
      }

      const result = await updateProposal(proposal.uuid, data)

      if (result.success && result.data) {
        showSuccessToast('제안서를 수정했습니다')
        router.push(`/proposals/${result.data.uuid}`)
      }
    } catch (error) {
      showErrorToast(error, '제안서 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">제안서 수정</h1>
        <p className="text-gray-600 mb-8">견적 요청: {proposal.requestTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제안 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="제안 제목을 입력하세요"
                />
                <p className="text-sm text-gray-500 mt-1">{title.length}/200자</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제안 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="제안 내용을 상세히 작성하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제안 금액 (원) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formatNumber(price)}
                  onChange={(e) => setPrice(parseNumber(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="80,000,000"
                />
                {price && parseInt(price) > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {(parseInt(price) / 10000).toLocaleString()}만원
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제안 유효기간
                </label>
                <div className="relative">
                  <DatePicker
                    selected={validUntil}
                    onChange={(date) => setValidUntil(date)}
                    locale={ko}
                    dateFormat="yyyy년 MM월 dd일"
                    placeholderText="날짜를 선택하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    wrapperClassName="w-full"
                  />
                  <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    제안 시작일
                  </label>
                  <input
                    type="date"
                    value={proposedStartDate ? proposedStartDate.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setProposedStartDate(e.target.value ? new Date(e.target.value) : null)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    제안 완료일
                  </label>
                  <input
                    type="date"
                    value={proposedEndDate ? proposedEndDate.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setProposedEndDate(e.target.value ? new Date(e.target.value) : null)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 가격 상세 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">가격 상세</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pricingKey}
                  onChange={(e) => setPricingKey(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="항목명 (예: 재료비)"
                />
                <input
                  type="text"
                  value={formatNumber(pricingValue)}
                  onChange={(e) => setPricingValue(parseNumber(e.target.value))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="금액 (원)"
                />
                <button
                  type="button"
                  onClick={handleAddPricing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  추가
                </button>
              </div>

              {Object.keys(pricingDetails).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(pricingDetails).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="ml-4 text-gray-900 font-bold">
                          {(value / 10000).toLocaleString()}만원
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePricing(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <IoCloseCircleOutline className="text-2xl" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 일정 정보 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">일정 정보</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={timelineKey}
                  onChange={(e) => setTimelineKey(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="단계명 (예: 설계기간)"
                />
                <input
                  type="text"
                  value={timelineValue}
                  onChange={(e) => setTimelineValue(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="기간 (예: 2주)"
                />
                <button
                  type="button"
                  onClick={handleAddTimeline}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  추가
                </button>
              </div>

              {Object.keys(timeline).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(timeline).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="ml-4 text-gray-900 font-bold">{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeline(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <IoCloseCircleOutline className="text-2xl" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 첨부파일 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">첨부파일</h2>
            <FileUpload
              attachments={attachments}
              onChange={setAttachments}
              maxFiles={10}
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoSaveOutline className="text-2xl" />
              {isSubmitting ? '저장 중...' : '수정 완료'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
