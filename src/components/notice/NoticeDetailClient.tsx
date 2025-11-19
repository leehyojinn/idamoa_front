'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiCalendar,
  FiEye,
  FiClock,
  FiTag,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi'
import { getNoticeEvent, deleteNotice, deleteEvent, type NoticeEvent } from '@/lib/api/notice-event'
import { getMyInfo } from '@/lib/api/auth'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { Dialog } from '@/components/ui/Dialog'

interface NoticeDetailClientProps {
  uuid: string
}

export default function NoticeDetailClient({ uuid }: NoticeDetailClientProps) {
  const router = useRouter()
  const [notice, setNotice] = useState<NoticeEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 관리자 체크
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await getMyInfo()
        if (response.success && response.data) {
          const adminStatus = response.data.roles.includes('ADMIN') && response.data.isAdmin === true
          setIsAdmin(adminStatus)
        }
      } catch (error) {
        setIsAdmin(false)
      }
    }
    fetchMyInfo()
  }, [])

  useEffect(() => {
    const fetchNotice = async () => {
      setIsLoading(true)
      try {
        const response = await getNoticeEvent(uuid)
        if (response.success && response.data) {
          setNotice(response.data)
        } else {
          showErrorToast(null, '공지사항을 찾을 수 없습니다')
          router.push('/notices')
        }
      } catch (error) {
        showErrorToast(error, '공지사항을 불러오는데 실패했습니다')
        router.push('/notices')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotice()
  }, [uuid, router])

  const handleDelete = async () => {
    if (!notice) return

    console.log('삭제 시작:', { uuid, boardType: notice.boardType })
    setIsDeleting(true)
    try {
      const response =
        notice.boardType === 'NOTICE'
          ? await deleteNotice(uuid)
          : await deleteEvent(uuid)

      console.log('삭제 응답:', response)

      if (response.success) {
        showSuccessToast('삭제되었습니다')
        router.push('/notices')
      } else {
        console.error('삭제 실패:', response)
        showErrorToast(null, response.message || '삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('삭제 에러:', error)
      showErrorToast(error, '삭제에 실패했습니다')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleEdit = () => {
    router.push(`/notices/${uuid}/edit`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-600 text-lg">공지사항을 찾을 수 없습니다</p>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            <FiArrowLeft />
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <div>
        <Link
          href="/notices"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <FiArrowLeft />
          목록으로
        </Link>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 md:p-8 border-b">
          {/* 배지 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                notice.boardType === 'NOTICE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {notice.boardType === 'NOTICE' ? '공지사항' : '이벤트'}
            </span>

            {notice.isPinned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                📌 고정
              </span>
            )}

            {notice.categoryName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {notice.categoryName}
              </span>
            )}

            {notice.boardType === 'EVENT' && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  notice.isEventEnded
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {notice.isEventEnded ? '종료' : '진행 중'}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {notice.title}
          </h1>

          {/* 메타 정보 */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <FiClock className="text-gray-400" />
              {formatDate(notice.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <FiEye className="text-gray-400" />
              조회 {notice.viewCount.toLocaleString()}
            </span>
            {notice.userName && (
              <span className="flex items-center gap-1.5">
                작성자: {notice.userName}
              </span>
            )}
          </div>

          {/* 이벤트 기간 */}
          {notice.boardType === 'EVENT' &&
            notice.eventStartDate &&
            notice.eventEndDate && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900">
                  <FiCalendar className="text-blue-600" />
                  <span className="font-semibold">이벤트 기간</span>
                </div>
                <p className="text-blue-800 mt-1">
                  {formatDate(notice.eventStartDate)} ~{' '}
                  {formatDate(notice.eventEndDate)}
                </p>
              </div>
            )}
        </div>

        {/* 썸네일 */}
        <div className="relative w-full aspect-video bg-gray-100">
          <Image
            src={notice.thumbnail?.fileUrl || '/images/img-placeholder.png'}
            alt={notice.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* 본문 내용 */}
        <div className="p-6 md:p-8">
          <div className="prose max-w-none">
            <div
              className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words"
              style={{ wordBreak: 'break-word' }}
            >
              {notice.content}
            </div>
          </div>
        </div>

        {/* 태그 */}
        {notice.tags && notice.tags.length > 0 && (
          <div className="px-6 md:px-8 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <FiTag className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">태그</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {notice.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 하단 정보 */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>작성일: {formatDate(notice.createdAt)}</p>
              {notice.updatedAt !== notice.createdAt && (
                <p className="mt-1">수정일: {formatDate(notice.updatedAt)}</p>
              )}
            </div>

            {/* 관리자 버튼 */}
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiEdit />
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiTrash2 />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 목록으로 버튼 */}
      <div className="flex justify-center">
        <Link
          href="/notices"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          <FiArrowLeft />
          목록으로
        </Link>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">삭제 확인</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              정말로 이 {notice?.boardType === 'NOTICE' ? '공지사항' : '이벤트'}을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-gray-500">
              삭제된 항목은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    삭제 중...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    삭제
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
