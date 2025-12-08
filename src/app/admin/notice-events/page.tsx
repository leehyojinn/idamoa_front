'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  searchNoticeEventsAdmin,
  deleteNotice,
  deleteEvent,
  endEvent,
  activateEvent,
  type NoticeEventListItem,
  type AdminNoticeEventSearchParams,
} from '@/lib/api/notice-event'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminNoticeEventsPage() {
  const [items, setItems] = useState<NoticeEventListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [boardType, setBoardType] = useState<'NOTICE' | 'EVENT' | ''>('')
  const [eventStatus, setEventStatus] = useState<'ACTIVE' | 'ENDED' | ''>('')
  const [isPublished, setIsPublished] = useState<boolean | ''>('')
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)

  const fetchItems = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: AdminNoticeEventSearchParams = {
        keyword: searchKeyword || undefined,
        boardType: boardType || undefined,
        eventStatus: eventStatus || undefined,
        isPublished: isPublished === '' ? undefined : isPublished,
        page,
        size: 20,
        sort: 'createdAt,DESC',
      }

      const response = await searchNoticeEventsAdmin(params)
      if (response.success && response.data) {
        setItems(response.data.content)
        setTotalPages(response.data.totalPages)
        setCurrentPage(response.data.number)
      }
    } catch (error) {
      showErrorToast(error, '목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems(0)
  }, [searchKeyword, boardType, eventStatus, isPublished])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleDelete = async (item: NoticeEventListItem) => {
    if (!confirm(`정말로 "${item.title}" 게시글을 삭제하시겠습니까?`)) return

    try {
      if (item.boardType === 'NOTICE') {
        await deleteNotice(item.uuid)
      } else {
        await deleteEvent(item.uuid)
      }
      showSuccessToast('게시글이 삭제되었습니다.')
      fetchItems(currentPage)
    } catch (error) {
      showErrorToast(error, '게시글 삭제에 실패했습니다.')
    }
  }

  const handleEndEvent = async (item: NoticeEventListItem) => {
    if (!confirm(`"${item.title}" 이벤트를 종료하시겠습니까?`)) return

    try {
      await endEvent(item.uuid)
      showSuccessToast('이벤트가 종료되었습니다.')
      fetchItems(currentPage)
    } catch (error) {
      showErrorToast(error, '이벤트 종료에 실패했습니다.')
    }
  }

  const handleActivateEvent = async (item: NoticeEventListItem) => {
    if (!confirm(`"${item.title}" 이벤트를 다시 활성화하시겠습니까?`)) return

    try {
      await activateEvent(item.uuid)
      showSuccessToast('이벤트가 활성화되었습니다.')
      fetchItems(currentPage)
    } catch (error) {
      showErrorToast(error, '이벤트 활성화에 실패했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">공지사항/이벤트 관리</h1>
          <Link
            href="/admin/notice-events/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 게시글 추가
          </Link>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제목/내용 검색"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              검색
            </button>
          </div>

          <div className="flex gap-4">
            <select
              value={boardType}
              onChange={(e) => setBoardType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="NOTICE">공지사항</option>
              <option value="EVENT">이벤트</option>
            </select>

            {boardType === 'EVENT' && (
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체 상태</option>
                <option value="ACTIVE">진행중</option>
                <option value="ENDED">종료</option>
              </select>
            )}

            <select
              value={isPublished === '' ? '' : isPublished ? 'true' : 'false'}
              onChange={(e) =>
                setIsPublished(
                  e.target.value === '' ? '' : e.target.value === 'true'
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체 게시 상태</option>
              <option value="true">게시중</option>
              <option value="false">미게시</option>
            </select>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이벤트 기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게시일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            item.boardType === 'NOTICE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.boardType === 'NOTICE' ? '공지' : '이벤트'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-2">
                          {item.thumbnail && (
                            <Image
                              src={item.thumbnail.fileUrl}
                              alt={item.title}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/notices/${item.uuid}`}
                              className="font-medium text-gray-900 hover:text-blue-600 block"
                              title={item.title}
                            >
                              {item.title}
                            </Link>
                            {item.isPinned && (
                              <span className="ml-2 text-red-600">📌</span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="mt-1 flex gap-1 flex-wrap">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.boardType === 'EVENT' &&
                        item.eventStartDate &&
                        item.eventEndDate ? (
                          <div className="text-xs">
                            <div>시작: {formatDate(item.eventStartDate)}</div>
                            <div>종료: {formatDate(item.eventEndDate)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs">
                          <div>조회 {item.viewCount}</div>
                          <div>좋아요 {item.likeCount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.isPublished ? '게시중' : '미게시'}
                          </span>
                          {item.boardType === 'EVENT' && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.isEventEnded
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.isEventEnded ? '종료' : '진행중'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.publishedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/notice-events/${item.uuid}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </Link>
                        {item.boardType === 'EVENT' && !item.isEventEnded && (
                          <button
                            onClick={() => handleEndEvent(item)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            종료
                          </button>
                        )}
                        {item.boardType === 'EVENT' && item.isEventEnded && (
                          <button
                            onClick={() => handleActivateEvent(item)}
                            className="text-green-600 hover:text-green-900"
                          >
                            재개
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchItems(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => fetchItems(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
