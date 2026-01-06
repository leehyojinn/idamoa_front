'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft, FiX, FiPlus, FiImage, FiVideo, FiTag, FiStar, FiDollarSign } from 'react-icons/fi'
import {
  adminGetPortfolio,
  adminUpdatePortfolio,
  type Portfolio,
  type AdminPortfolioUpdateRequest,
  type FileInfo
} from '@/lib/api/portfolio'
import { uploadFile } from '@/lib/api/file'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import Checkbox from '@/components/ui/Checkbox'

// 파일 크기 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface NewFile {
  file: File
  preview: string
}

export default function AdminPortfolioEditPage() {
  const params = useParams()
  const router = useRouter()
  const portfolioUuid = params.uuid as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)

  // 기본 정보
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectScale, setProjectScale] = useState('')
  const [projectDuration, setProjectDuration] = useState<number | ''>('')
  const [projectDate, setProjectDate] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [actualCost, setActualCost] = useState<number | ''>('')

  // 미디어
  const [existingImages, setExistingImages] = useState<FileInfo[]>([])
  const [existingVideos, setExistingVideos] = useState<FileInfo[]>([])
  const [newImages, setNewImages] = useState<NewFile[]>([])
  const [newVideos, setNewVideos] = useState<NewFile[]>([])
  const [thumbnailUuid, setThumbnailUuid] = useState<string | undefined>()
  const [newThumbnail, setNewThumbnail] = useState<NewFile | null>(null)
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | undefined>()

  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // 기타
  const [relatedLink, setRelatedLink] = useState('')
  const [copyrightOwner, setCopyrightOwner] = useState('')
  const [copyrightLicense, setCopyrightLicense] = useState('')
  const [copyrightAttribution, setCopyrightAttribution] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [displayOrder, setDisplayOrder] = useState<number | ''>('')

  // 관리자 전용
  const [isFeatured, setIsFeatured] = useState(false)

  // 프로모션 관리
  const [promotionType, setPromotionType] = useState<'STANDARD' | 'PREMIUM' | ''>('')
  const [autoRenew, setAutoRenew] = useState(false)
  const [promotionStartDate, setPromotionStartDate] = useState('')
  const [promotionEndDate, setPromotionEndDate] = useState('')
  const [promotionWeight, setPromotionWeight] = useState<number | ''>('')
  const [promotionMonthlyPrice, setPromotionMonthlyPrice] = useState<number | ''>('')
  const [cancelPromotion, setCancelPromotion] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminGetPortfolio(portfolioUuid)
      if (response.success && response.data) {
        const p = response.data
        setPortfolio(p)

        // 기본 정보
        setTitle(p.title || '')
        setDescription(p.description || '')
        setContent(p.content || '')
        setCategory(p.category || '')
        setProjectType(p.projectType || '')
        setProjectScale(p.projectScale || '')
        setProjectDuration(p.projectDuration || '')
        setProjectDate(p.projectDate || '')
        setBudgetRange(p.budgetRange || '')
        setActualCost(p.actualCost || '')

        // 미디어
        setExistingImages(p.images || [])
        setExistingVideos(p.videos || [])
        setExistingThumbnailUrl(p.thumbnailUrl)

        // 태그
        setTags(p.tags || [])

        // 기타
        setRelatedLink(p.relatedLink || '')
        setCopyrightOwner(p.copyrightOwner || '')
        setCopyrightLicense(p.copyrightLicense || '')
        setCopyrightAttribution(p.copyrightAttribution || '')
        setIsPublic(p.isPublic)
        setDisplayOrder(p.displayOrder || '')

        // 관리자 전용
        setIsFeatured(p.isFeatured)

        // 프로모션
        if (p.promotion) {
          setPromotionType(p.promotion.promotionType)
          setAutoRenew(p.promotion.autoRenew)
          setPromotionStartDate(p.promotion.startDate)
          setPromotionEndDate(p.promotion.endDate)
          setPromotionWeight(p.promotion.weight)
          setPromotionMonthlyPrice(p.promotion.monthlyPrice)
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '포트폴리오를 찾을 수 없습니다')
        router.push('/admin/portfolios')
      } else {
        showErrorToast(error, '포트폴리오를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [portfolioUuid, router])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: NewFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setNewImages([...newImages, ...newFiles])
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: NewFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setNewVideos([...newVideos, ...newFiles])
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setNewThumbnail({
      file,
      preview: URL.createObjectURL(file)
    })
    setThumbnailUuid(undefined)
    setExistingThumbnailUrl(undefined)
  }

  const handleRemoveExistingImage = (uuid: string) => {
    setExistingImages(existingImages.filter(img => img.uuid !== uuid))
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
  }

  const handleRemoveExistingVideo = (uuid: string) => {
    setExistingVideos(existingVideos.filter(vid => vid.uuid !== uuid))
  }

  const handleRemoveNewVideo = (index: number) => {
    setNewVideos(newVideos.filter((_, i) => i !== index))
  }

  const handleRemoveThumbnail = () => {
    setNewThumbnail(null)
    setThumbnailUuid(undefined)
    setExistingThumbnailUrl(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showErrorToast(null, '제목을 입력하세요')
      return
    }

    setIsSubmitting(true)

    try {
      // 새 이미지 업로드
      const uploadedImageUuids: string[] = []
      for (const newImage of newImages) {
        try {
          const result = await uploadFile(newImage.file, 'PORTFOLIO')
          uploadedImageUuids.push(result.uuid)
        } catch (error) {
          showErrorToast(error, `이미지 업로드 실패: ${newImage.file.name}`)
          setIsSubmitting(false)
          return
        }
      }

      // 새 비디오 업로드
      const uploadedVideoUuids: string[] = []
      for (const newVideo of newVideos) {
        try {
          const result = await uploadFile(newVideo.file, 'PORTFOLIO')
          uploadedVideoUuids.push(result.uuid)
        } catch (error) {
          showErrorToast(error, `비디오 업로드 실패: ${newVideo.file.name}`)
          setIsSubmitting(false)
          return
        }
      }

      // 새 썸네일 업로드
      let newThumbnailUuid: string | undefined
      if (newThumbnail) {
        try {
          const result = await uploadFile(newThumbnail.file, 'PORTFOLIO')
          newThumbnailUuid = result.uuid
        } catch (error) {
          showErrorToast(error, '썸네일 업로드 실패')
          setIsSubmitting(false)
          return
        }
      }

      // 요청 데이터 구성
      const data: AdminPortfolioUpdateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        category: category.trim() || undefined,
        projectType: projectType.trim() || undefined,
        projectScale: projectScale.trim() || undefined,
        projectDuration: projectDuration ? Number(projectDuration) : undefined,
        projectDate: projectDate || undefined,
        budgetRange: budgetRange.trim() || undefined,
        actualCost: actualCost ? Number(actualCost) : undefined,
        imageUuids: [...existingImages.map(img => img.uuid), ...uploadedImageUuids],
        videoUuids: [...existingVideos.map(vid => vid.uuid), ...uploadedVideoUuids],
        thumbnailUuid: newThumbnailUuid || thumbnailUuid,
        tags: tags.length > 0 ? tags : undefined,
        relatedLink: relatedLink.trim() || undefined,
        copyrightOwner: copyrightOwner.trim() || undefined,
        copyrightLicense: copyrightLicense.trim() || undefined,
        copyrightAttribution: copyrightAttribution.trim() || undefined,
        isPublic,
        displayOrder: displayOrder ? Number(displayOrder) : undefined,
        isFeatured,
      }

      // 프로모션 정보
      if (cancelPromotion) {
        data.cancelPromotion = true
      } else if (promotionType) {
        data.promotionType = promotionType as 'STANDARD' | 'PREMIUM'
        data.autoRenew = autoRenew
        data.promotionStartDate = promotionStartDate || undefined
        data.promotionEndDate = promotionEndDate || undefined
        data.promotionWeight = promotionWeight ? Number(promotionWeight) : undefined
        data.promotionMonthlyPrice = promotionMonthlyPrice ? Number(promotionMonthlyPrice) : undefined
      }

      await adminUpdatePortfolio(portfolioUuid, data)
      showSuccessToast('포트폴리오가 수정되었습니다')
      router.push('/admin/portfolios')
    } catch (error: any) {
      showErrorToast(error, '포트폴리오 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">포트폴리오를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        <Link
          href="/admin/portfolios"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          목록으로
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">포트폴리오 수정</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiStar className="text-blue-600" />
                기본 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="포트폴리오 제목"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 사무실, 주거, 상업공간"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 유형</label>
                    <input
                      type="text"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 리모델링, 신축, 인테리어"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">간단 설명</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="포트폴리오에 대한 간단한 설명"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">상세 내용</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="포트폴리오 상세 내용"
                  />
                </div>
              </div>
            </div>

            {/* 프로젝트 정보 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">프로젝트 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 규모</label>
                  <input
                    type="text"
                    value={projectScale}
                    onChange={(e) => setProjectScale(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 30평"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 기간 (일)</label>
                  <input
                    type="number"
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="45"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 완료일</label>
                  <input
                    type="date"
                    value={projectDate}
                    onChange={(e) => setProjectDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">예산 범위</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 5000만원~1억원"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">실제 비용 (원)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="75000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">표시 순서</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* 관리자 설정 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiStar className="text-yellow-500" />
                관리자 설정
              </h2>
              <div className="flex items-center gap-6">
                <Checkbox
                  checked={isFeatured}
                  onChange={setIsFeatured}
                  label="추천 포트폴리오"
                  description="메인 페이지에 우선 노출됩니다"
                />
                <Checkbox
                  checked={isPublic}
                  onChange={setIsPublic}
                  label="공개"
                  description="공개 여부를 설정합니다"
                />
              </div>
            </div>

            {/* 프로모션 관리 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-green-600" />
                프로모션 관리
              </h2>

              {portfolio?.promotion && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    현재 프로모션: <strong>{portfolio.promotion.promotionType}</strong>
                    {' '}| 상태: <strong>{portfolio.promotion.status}</strong>
                    {' '}| 남은 기간: <strong>{portfolio.promotion.remainingDays}일</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로모션 타입</label>
                  <select
                    value={promotionType}
                    onChange={(e) => setPromotionType(e.target.value as 'STANDARD' | 'PREMIUM' | '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">없음</option>
                    <option value="STANDARD">STANDARD (일반우대)</option>
                    <option value="PREMIUM">PREMIUM (강력우대)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">가중치</label>
                  <input
                    type="number"
                    value={promotionWeight}
                    onChange={(e) => setPromotionWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="높을수록 우선 노출 (예: 100)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">시작일</label>
                  <input
                    type="date"
                    value={promotionStartDate}
                    onChange={(e) => setPromotionStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">종료일</label>
                  <input
                    type="date"
                    value={promotionEndDate}
                    onChange={(e) => setPromotionEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">월 가격 (0 = 무료)</label>
                  <input
                    type="number"
                    value={promotionMonthlyPrice}
                    onChange={(e) => setPromotionMonthlyPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50000"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <Checkbox
                    checked={autoRenew}
                    onChange={setAutoRenew}
                    label="자동 갱신"
                  />
                </div>
              </div>

              {portfolio?.promotion && (
                <div className="mt-4">
                  <Checkbox
                    checked={cancelPromotion}
                    onChange={setCancelPromotion}
                    label="프로모션 취소"
                    description="체크하면 현재 프로모션이 취소됩니다"
                  />
                </div>
              )}
            </div>

            {/* 이미지 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiImage className="text-purple-600" />
                이미지
              </h2>
              <div className="space-y-4">
                <label
                  htmlFor="image-upload"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
                >
                  <FiPlus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-blue-600 font-medium">이미지 추가</span>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                </label>

                {(existingImages.length > 0 || newImages.length > 0) && (
                  <div className="grid grid-cols-4 gap-4">
                    {existingImages.map((img) => (
                      <div key={img.uuid} className="relative group">
                        <Image
                          src={img.fileUrl}
                          alt={img.originalFilename}
                          width={150}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.uuid)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {newImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={img.preview}
                          alt="새 이미지"
                          width={150}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">새 이미지</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 비디오 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiVideo className="text-red-600" />
                비디오
              </h2>
              <div className="space-y-4">
                <label
                  htmlFor="video-upload"
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
                >
                  <FiPlus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-blue-600 font-medium">비디오 추가</span>
                  <input
                    id="video-upload"
                    type="file"
                    className="hidden"
                    accept="video/*"
                    multiple
                    onChange={handleVideoSelect}
                  />
                </label>

                {(existingVideos.length > 0 || newVideos.length > 0) && (
                  <div className="space-y-2">
                    {existingVideos.map((vid) => (
                      <div key={vid.uuid} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FiVideo className="text-gray-500" />
                          <span className="text-sm">{vid.originalFilename}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(vid.fileSize)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingVideo(vid.uuid)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                    {newVideos.map((vid, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <FiVideo className="text-green-600" />
                          <span className="text-sm">{vid.file.name}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(vid.file.size)}</span>
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">새 비디오</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewVideo(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 썸네일 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">썸네일</h2>
              <div className="space-y-4">
                {!newThumbnail && !existingThumbnailUrl ? (
                  <label
                    htmlFor="thumbnail-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer block"
                  >
                    <FiImage className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-blue-600 font-medium">썸네일 선택</span>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                    {newThumbnail ? (
                      <Image
                        src={newThumbnail.preview}
                        alt="새 썸네일"
                        width={120}
                        height={80}
                        className="w-30 h-20 object-cover rounded border-2 border-green-400"
                        unoptimized
                      />
                    ) : existingThumbnailUrl ? (
                      <Image
                        src={existingThumbnailUrl}
                        alt="기존 썸네일"
                        width={120}
                        height={80}
                        className="w-30 h-20 object-cover rounded"
                      />
                    ) : null}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {newThumbnail ? newThumbnail.file.name : '기존 썸네일'}
                      </p>
                      {newThumbnail && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">새 이미지</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 태그 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiTag className="text-blue-600" />
                태그
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="태그 입력 후 엔터"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    추가
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 저작권 정보 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">저작권 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">저작권자</label>
                  <input
                    type="text"
                    value={copyrightOwner}
                    onChange={(e) => setCopyrightOwner(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="저작권자명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">라이선스</label>
                  <input
                    type="text"
                    value={copyrightLicense}
                    onChange={(e) => setCopyrightLicense(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: CC BY-NC"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">저작권 표시</label>
                  <input
                    type="text"
                    value={copyrightAttribution}
                    onChange={(e) => setCopyrightAttribution(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="저작권 표시 문구"
                  />
                </div>
              </div>
            </div>

            {/* 관련 링크 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">관련 링크</h2>
              <input
                type="url"
                value={relatedLink}
                onChange={(e) => setRelatedLink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/project"
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '포트폴리오 수정'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/portfolios')}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
