'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FiSave, FiX, FiCalendar, FiPlus, FiImage, FiUpload } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { getNoticeEvent, updateNotice, updateEvent, type NoticeEvent } from '@/lib/api/notice-event'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useFileUpload } from '@/hooks/useFile'
import Checkbox from '@/components/ui/Checkbox'

interface NoticeEditClientProps {
  uuid: string
}

export default function NoticeEditClient({ uuid }: NoticeEditClientProps) {
  const router = useRouter()
  const fileUploadMutation = useFileUpload()

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [boardType, setBoardType] = useState<'NOTICE' | 'EVENT'>('NOTICE')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [thumbnailUuid, setThumbnailUuid] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 기존 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        const response = await getNoticeEvent(uuid)
        if (response.success && response.data) {
          const data = response.data
          setBoardType(data.boardType as 'NOTICE' | 'EVENT')
          setTitle(data.title)
          setContent(data.content)
          setTags(data.tags || [])
          setIsPinned(data.isPinned)

          if (data.thumbnail) {
            setThumbnailUuid(data.thumbnail.uuid)
            setThumbnailUrl(data.thumbnail.fileUrl)
          }

          if (data.boardType === 'EVENT' && data.eventStartDate && data.eventEndDate) {
            // ISO 날짜를 datetime-local 형식으로 변환
            setEventStartDate(new Date(data.eventStartDate).toISOString().slice(0, 16))
            setEventEndDate(new Date(data.eventEndDate).toISOString().slice(0, 16))
          }
        } else {
          showErrorToast(null, '공지사항을 찾을 수 없습니다')
          router.push('/notices')
        }
      } catch (error) {
        showErrorToast(error, '공지사항을 불러오는데 실패했습니다')
        router.push('/notices')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [uuid, router])

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showErrorToast(null, '이미지 파일만 업로드 가능합니다')
      return
    }

    setIsUploadingThumbnail(true)

    try {
      const result = await fileUploadMutation.mutateAsync({
        file,
        entityType: 'OTHER',
        entityId: null,
      })

      setThumbnailUuid(result.uuid)
      setThumbnailUrl(result.fileUrl)
      showSuccessToast('썸네일 업로드 완료')
    } catch (error) {
      showErrorToast(error, '썸네일 업로드 실패')
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailUuid('')
    setThumbnailUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showErrorToast(null, '제목을 입력해주세요')
      return
    }

    if (!content.trim()) {
      showErrorToast(null, '내용을 입력해주세요')
      return
    }

    if (boardType === 'EVENT') {
      if (!eventStartDate || !eventEndDate) {
        showErrorToast(null, '이벤트 시작일과 종료일을 입력해주세요')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (boardType === 'NOTICE') {
        const data = {
          title: title.trim(),
          content: content.trim(),
          tags: tags,
          isPinned,
          isPublished: true,
          thumbnailUuid: thumbnailUuid.trim() || undefined,
        }

        const response = await updateNotice(uuid, data)

        if (response.success) {
          showSuccessToast('공지사항이 수정되었습니다')
          router.push(`/notices/${uuid}`)
        } else {
          showErrorToast(null, response.message || '공지사항 수정에 실패했습니다')
        }
      } else {
        const data = {
          title: title.trim(),
          content: content.trim(),
          tags: tags,
          isPinned,
          isPublished: true,
          thumbnailUuid: thumbnailUuid.trim() || undefined,
          eventStartDate: new Date(eventStartDate).toISOString(),
          eventEndDate: new Date(eventEndDate).toISOString(),
        }

        const response = await updateEvent(uuid, data)

        if (response.success) {
          showSuccessToast('이벤트가 수정되었습니다')
          router.push(`/notices/${uuid}`)
        } else {
          showErrorToast(null, response.message || '이벤트 수정에 실패했습니다')
        }
      }
    } catch (error) {
      showErrorToast(error, '수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {boardType === 'NOTICE' ? '공지사항' : '이벤트'} 수정
        </h1>
        <p className="text-gray-600 mt-2">
          기존 {boardType === 'NOTICE' ? '공지사항' : '이벤트'}을 수정합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded"></span>
            기본 정보
          </h2>

          <div className="space-y-5">
            {/* 게시판 타입 (읽기 전용) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                게시판 타입
              </label>
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {boardType === 'NOTICE' ? '공지사항' : '이벤트'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {boardType === 'NOTICE' ? '시스템 공지 및 안내사항' : '프로모션 및 할인 이벤트'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                게시판 타입은 수정할 수 없습니다
              </p>
            </div>

            {/* 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length} / 200자
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                maxLength={10000}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length} / 10,000자
              </p>
            </div>
          </div>
        </div>

        {/* 이벤트 기간 */}
        {boardType === 'EVENT' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded"></span>
              이벤트 기간
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="eventStartDate"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  시작일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="eventStartDate"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="eventEndDate"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  종료일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    id="eventEndDate"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 추가 설정 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded"></span>
            추가 설정
          </h2>

          <div className="space-y-5">
            {/* 태그 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                태그
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="태그를 입력하고 Enter 또는 + 버튼을 눌러주세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-5 py-3 bg-primary hover:bg-primary-800 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <FiPlus />
                  추가
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-primary-100 text-primary px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary transition-colors"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 썸네일 이미지 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                썸네일 이미지
              </label>

              {!thumbnailUrl ? (
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={isUploadingThumbnail}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-400 hover:bg-primary-50 transition-all text-center">
                    {isUploadingThumbnail ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-600">업로드 중...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FiUpload className="text-4xl text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            클릭하여 썸네일 이미지 업로드
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, GIF 등 이미지 파일
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              ) : (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200 group">
                  <Image
                    src={thumbnailUrl}
                    alt="썸네일 미리보기"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <IoClose className="text-xl" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">썸네일 이미지</p>
                    <p className="text-white/80 text-xs mt-1">클릭하여 삭제</p>
                  </div>
                </div>
              )}
            </div>

            {/* 상단 고정 */}
            <div>
              <Checkbox
                checked={isPinned}
                onChange={setIsPinned}
                label="상단 고정"
                description="목록 상단에 고정하여 표시합니다"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-800 text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200"
            >
              <FiSave className="text-xl" />
              {isSubmitting ? '수정 중...' : '수정하기'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
            >
              <FiX className="text-xl" />
              취소
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
