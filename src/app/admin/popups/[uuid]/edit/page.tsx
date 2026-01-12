'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  getPopup,
  updatePopup,
  POSITION_LABELS,
  SIZE_UNITS,
  type Popup,
  type PopupUpdateRequest,
  type PopupPosition,
  type SizeUnit,
} from '@/lib/api/popup'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'

// 로컬 타임존을 유지하면서 ISO 형식으로 변환
const formatDateToLocal = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export default function EditPopupPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [popup, setPopup] = useState<Popup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageData, setImageData] = useState<ImageData | undefined>(undefined)
  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(null)
  const [displayEndDate, setDisplayEndDate] = useState<Date | null>(null)

  const [formData, setFormData] = useState<PopupUpdateRequest>({
    title: '',
    imageUuid: '',
    linkUrl: '',
    // PC 설정
    width: 600,
    widthUnit: 'px',
    height: 800,
    heightUnit: 'px',
    position: 'CENTER',
    offsetX: 0,
    offsetXUnit: 'px',
    offsetY: 0,
    offsetYUnit: 'px',
    // 모바일 설정
    mobileEnabled: true,
    mobileWidth: 90,
    mobileWidthUnit: '%',
    mobileHeight: undefined,
    mobileHeightUnit: 'px',
    mobilePosition: 'CENTER',
    mobileOffsetX: 0,
    mobileOffsetXUnit: 'px',
    mobileOffsetY: 0,
    mobileOffsetYUnit: 'px',
    // 노출 설정
    displayOrder: 0,
  })

  useEffect(() => {
    const fetchPopup = async () => {
      if (!uuid) return

      setIsLoading(true)
      try {
        const response = await getPopup(uuid)
        if (response.success) {
          const data = response.data
          setPopup(data)
          setFormData({
            title: data.title,
            imageUuid: data.imageUuid || '',
            linkUrl: data.linkUrl || '',
            // PC 설정
            width: data.width || 600,
            widthUnit: data.widthUnit || 'px',
            height: data.height || 800,
            heightUnit: data.heightUnit || 'px',
            position: data.position || 'CENTER',
            offsetX: data.offsetX || 0,
            offsetXUnit: data.offsetXUnit || 'px',
            offsetY: data.offsetY || 0,
            offsetYUnit: data.offsetYUnit || 'px',
            // 모바일 설정
            mobileEnabled: data.mobileEnabled ?? true,
            mobileWidth: data.mobileWidth || 90,
            mobileWidthUnit: data.mobileWidthUnit || '%',
            mobileHeight: data.mobileHeight || undefined,
            mobileHeightUnit: data.mobileHeightUnit || 'px',
            mobilePosition: data.mobilePosition || 'CENTER',
            mobileOffsetX: data.mobileOffsetX || 0,
            mobileOffsetXUnit: data.mobileOffsetXUnit || 'px',
            mobileOffsetY: data.mobileOffsetY || 0,
            mobileOffsetYUnit: data.mobileOffsetYUnit || 'px',
            // 노출 설정
            displayOrder: data.displayOrder,
          })
          // Set dates
          if (data.displayStartDate) {
            setDisplayStartDate(new Date(data.displayStartDate))
          }
          if (data.displayEndDate) {
            setDisplayEndDate(new Date(data.displayEndDate))
          }
          // Set image data if exists
          if (data.imageUuid && data.imageUrl) {
            setImageData({
              uuid: data.imageUuid,
              url: data.imageUrl,
            })
          }
        }
      } catch (error) {
        showErrorToast(error, '팝업을 불러오는데 실패했습니다.')
        router.push('/admin/popups')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPopup()
  }, [uuid, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showErrorToast(null, '제목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // 링크 URL에 http:// 또는 https:// 자동 추가
      let processedLinkUrl = formData.linkUrl?.trim()
      if (processedLinkUrl && !processedLinkUrl.startsWith('http://') && !processedLinkUrl.startsWith('https://')) {
        processedLinkUrl = 'https://' + processedLinkUrl
      }

      // 빈 문자열을 undefined로 변환
      const submitData: PopupUpdateRequest = {
        ...formData,
        imageUuid: imageData?.uuid || undefined,
        linkUrl: processedLinkUrl || undefined,
        displayStartDate: formatDateToLocal(displayStartDate),
        displayEndDate: formatDateToLocal(displayEndDate),
      }

      const result = await updatePopup(uuid, submitData)
      if (result.success) {
        showSuccessToast('팝업이 수정되었습니다.')
        router.push('/admin/popups')
      }
    } catch (error) {
      showErrorToast(error, '팝업 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
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

  if (!popup) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-20">
            <p className="text-gray-500">팝업을 찾을 수 없습니다.</p>
            <Link href="/admin/popups" className="mt-4 inline-block text-primary hover:underline">
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
      <div className="container mx-auto px-4 py-8 max-w-3xl min-h-[calc(100vh-64px-200px)]">
        {/* 뒤로가기 */}
        <div className="mb-6">
          <Link
            href="/admin/popups"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>

        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">팝업 수정</h1>
          <p className="text-gray-600 mt-1">팝업 정보를 수정합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b">기본 정보</h2>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                placeholder="팝업 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                팝업 이미지 <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={imageData}
                onChange={(data) => {
                  if (Array.isArray(data)) {
                    setImageData(data[0])
                  } else {
                    setImageData(data)
                  }
                }}
                multiple={false}
                entityType="POPUP_IMAGE"
              />
              <p className="mt-1 text-xs text-gray-500">
                팝업에 표시할 이미지를 업로드하세요.
              </p>
            </div>

            <div>
              <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-2">
                링크 URL
              </label>
              <input
                type="text"
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                placeholder="example.com (http/https 자동 추가)"
              />
              <p className="mt-1 text-xs text-gray-500">
                팝업 클릭 시 이동할 URL (http:// 또는 https:// 없이 입력 가능)
              </p>
            </div>
          </div>

          {/* PC 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">PC</span>
              크기 및 위치
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">너비</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.width || ''}
                    onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || undefined })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="600"
                  />
                  <select
                    value={formData.widthUnit}
                    onChange={(e) => setFormData({ ...formData, widthUnit: e.target.value as SizeUnit })}
                    className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    {SIZE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">높이</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || undefined })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    placeholder="800"
                  />
                  <select
                    value={formData.heightUnit}
                    onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value as SizeUnit })}
                    className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    {SIZE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as PopupPosition })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              >
                {(Object.keys(POSITION_LABELS) as PopupPosition[]).map((pos) => (
                  <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>
                ))}
              </select>
            </div>

            {formData.position === 'CUSTOM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X 오프셋</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.offsetX || 0}
                      onChange={(e) => setFormData({ ...formData, offsetX: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <select
                      value={formData.offsetXUnit}
                      onChange={(e) => setFormData({ ...formData, offsetXUnit: e.target.value as SizeUnit })}
                      className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    >
                      {SIZE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Y 오프셋</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.offsetY || 0}
                      onChange={(e) => setFormData({ ...formData, offsetY: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <select
                      value={formData.offsetYUnit}
                      onChange={(e) => setFormData({ ...formData, offsetYUnit: e.target.value as SizeUnit })}
                      className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    >
                      {SIZE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 모바일 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">모바일</span>
                크기 및 위치
              </h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mobileEnabled}
                  onChange={(e) => setFormData({ ...formData, mobileEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary-400"
                />
                <span className="ml-2 text-sm text-gray-700">모바일 설정 사용</span>
              </label>
            </div>

            {formData.mobileEnabled && (
              <>
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  모바일에서는 별도의 크기와 위치 설정이 적용됩니다. 비활성화하면 PC 설정이 그대로 사용됩니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">너비</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.mobileWidth || ''}
                        onChange={(e) => setFormData({ ...formData, mobileWidth: parseInt(e.target.value) || undefined })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        placeholder="90"
                      />
                      <select
                        value={formData.mobileWidthUnit}
                        onChange={(e) => setFormData({ ...formData, mobileWidthUnit: e.target.value as SizeUnit })}
                        className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">높이</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.mobileHeight || ''}
                        onChange={(e) => setFormData({ ...formData, mobileHeight: parseInt(e.target.value) || undefined })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        placeholder="auto"
                      />
                      <select
                        value={formData.mobileHeightUnit}
                        onChange={(e) => setFormData({ ...formData, mobileHeightUnit: e.target.value as SizeUnit })}
                        className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      >
                        {SIZE_UNITS.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
                  <select
                    value={formData.mobilePosition}
                    onChange={(e) => setFormData({ ...formData, mobilePosition: e.target.value as PopupPosition })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  >
                    {(Object.keys(POSITION_LABELS) as PopupPosition[]).map((pos) => (
                      <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>
                    ))}
                  </select>
                </div>

                {formData.mobilePosition === 'CUSTOM' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">X 오프셋</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.mobileOffsetX || 0}
                          onChange={(e) => setFormData({ ...formData, mobileOffsetX: parseInt(e.target.value) || 0 })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                        <select
                          value={formData.mobileOffsetXUnit}
                          onChange={(e) => setFormData({ ...formData, mobileOffsetXUnit: e.target.value as SizeUnit })}
                          className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        >
                          {SIZE_UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Y 오프셋</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.mobileOffsetY || 0}
                          onChange={(e) => setFormData({ ...formData, mobileOffsetY: parseInt(e.target.value) || 0 })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                        <select
                          value={formData.mobileOffsetYUnit}
                          onChange={(e) => setFormData({ ...formData, mobileOffsetYUnit: e.target.value as SizeUnit })}
                          className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        >
                          {SIZE_UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 노출 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b">노출 설정</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  노출 시작일시
                </label>
                <DatePicker
                  selected={displayStartDate}
                  onChange={(date) => setDisplayStartDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="시작일시 선택"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  노출 종료일시
                </label>
                <DatePicker
                  selected={displayEndDate}
                  onChange={(date) => setDisplayEndDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="종료일시 선택"
                  minDate={displayStartDate || undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 mb-2">
                노출 순서
              </label>
              <input
                type="number"
                id="displayOrder"
                value={formData.displayOrder || 0}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">낮을수록 먼저 표시됩니다</p>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">통계 정보</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">조회수</p>
                <p className="text-2xl font-bold text-gray-900">{popup.viewCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">클릭수</p>
                <p className="text-2xl font-bold text-gray-900">{popup.clickCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CTR</p>
                <p className="text-2xl font-bold text-gray-900">
                  {popup.viewCount > 0
                    ? ((popup.clickCount / popup.viewCount) * 100).toFixed(2) + '%'
                    : '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/popups"
              className="flex-1 py-4 px-6 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '수정 중...' : '팝업 수정'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}
