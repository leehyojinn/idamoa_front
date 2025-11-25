'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getPopup,
  updatePopup,
  POSITION_LABELS,
  type Popup,
  type PopupUpdateRequest,
  type PopupPosition,
} from '@/lib/api/popup'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ImageUpload, { type ImageData } from '@/components/ui/ImageUpload'

export default function EditPopupPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string

  const [popup, setPopup] = useState<Popup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageData, setImageData] = useState<ImageData | undefined>(undefined)

  const [formData, setFormData] = useState<PopupUpdateRequest>({
    title: '',
    imageUuid: '',
    linkUrl: '',
    width: 600,
    height: 800,
    position: 'CENTER',
    offsetX: 0,
    offsetY: 0,
    displayStartDate: '',
    displayEndDate: '',
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
            width: data.width || 600,
            height: data.height || 800,
            position: data.position || 'CENTER',
            offsetX: data.offsetX || 0,
            offsetY: data.offsetY || 0,
            displayStartDate: data.displayStartDate
              ? new Date(data.displayStartDate).toISOString().slice(0, 16)
              : '',
            displayEndDate: data.displayEndDate
              ? new Date(data.displayEndDate).toISOString().slice(0, 16)
              : '',
            displayOrder: data.displayOrder,
          })
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
        displayStartDate: formData.displayStartDate || undefined,
        displayEndDate: formData.displayEndDate || undefined,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <Link href="/admin/popups" className="mt-4 inline-block text-blue-600 hover:underline">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="팝업 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                팝업 이미지 <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={imageData}
                onChange={setImageData}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example.com (http/https 자동 추가)"
              />
              <p className="mt-1 text-xs text-gray-500">
                팝업 클릭 시 이동할 URL (http:// 또는 https:// 없이 입력 가능)
              </p>
            </div>
          </div>

          {/* 크기 및 위치 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b">크기 및 위치</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                  너비 (px)
                </label>
                <input
                  type="number"
                  id="width"
                  value={formData.width || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, width: parseInt(e.target.value) || undefined })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                  높이 (px)
                </label>
                <input
                  type="number"
                  id="height"
                  value={formData.height || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, height: parseInt(e.target.value) || undefined })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                위치
              </label>
              <select
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value as PopupPosition })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {(Object.keys(POSITION_LABELS) as PopupPosition[]).map((pos) => (
                  <option key={pos} value={pos}>
                    {POSITION_LABELS[pos]}
                  </option>
                ))}
              </select>
            </div>

            {formData.position === 'CUSTOM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="offsetX" className="block text-sm font-medium text-gray-700 mb-2">
                    X 오프셋 (px)
                  </label>
                  <input
                    type="number"
                    id="offsetX"
                    value={formData.offsetX || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, offsetX: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="offsetY" className="block text-sm font-medium text-gray-700 mb-2">
                    Y 오프셋 (px)
                  </label>
                  <input
                    type="number"
                    id="offsetY"
                    value={formData.offsetY || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, offsetY: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 노출 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 pb-3 border-b">노출 설정</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="displayStartDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  노출 시작일시
                </label>
                <input
                  type="datetime-local"
                  id="displayStartDate"
                  value={formData.displayStartDate}
                  onChange={(e) => setFormData({ ...formData, displayStartDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="displayEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                  노출 종료일시
                </label>
                <input
                  type="datetime-local"
                  id="displayEndDate"
                  value={formData.displayEndDate}
                  onChange={(e) => setFormData({ ...formData, displayEndDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
