'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiBell, FiCalendar, FiArchive, FiEye, FiClock, FiImage } from 'react-icons/fi'
import { searchNoticeEvents, getPinnedNoticeEvents, type NoticeEventListItem } from '@/lib/api/notice-event'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { getMyInfo } from '@/lib/api/auth'

type TabType = 'notice' | 'event' | 'ended'

export default function NoticeListClient() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('notice')
  const [items, setItems] = useState<NoticeEventListItem[]>([])
  const [pinnedItems, setPinnedItems] = useState<NoticeEventListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // /api/auth/me 호출해서 유저 정보 확인 및 관리자 여부 설정
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await getMyInfo()
        if (response.success && response.data) {
          // roles 배열에 'ADMIN'이 있고 isAdmin이 true인 경우만 관리자로 설정
          const adminStatus = response.data.roles.includes('ADMIN') && response.data.isAdmin === true
          setIsAdmin(adminStatus)
        }
      } catch (error) {
        setIsAdmin(false)
      }
    }

    fetchMyInfo()
  }, [])


  const fetchData = useCallback(async (page: number) => {
    setIsLoading(true)
    try {
      const params: any = {
        page,
        size: 20,
        sort: 'publishedAt,DESC'
      }

      if (activeTab === 'notice') {
        params.boardType = 'NOTICE'
      } else if (activeTab === 'event') {
        params.boardType = 'EVENT'
        params.eventStatus = 'ACTIVE'
      } else if (activeTab === 'ended') {
        params.boardType = 'EVENT'
        params.eventStatus = 'ENDED'
      }

      const result = await searchNoticeEvents(params)

      if (result.success && result.data) {
        setItems(result.data.content || [])
        setTotalPages(result.data.totalPages || 0)
        setTotalElements(result.data.totalElements || 0)
      } else {
        setItems([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      showErrorToast(error, '목록을 불러오는데 실패했습니다')
      setItems([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  const fetchPinnedData = useCallback(async () => {
    try {
      if (activeTab === 'notice') {
        const result = await getPinnedNoticeEvents('NOTICE')
        if (result.success && result.data) {
          setPinnedItems(result.data)
        }
      } else if (activeTab === 'event') {
        const result = await getPinnedNoticeEvents('EVENT')
        if (result.success && result.data) {
          // 진행 중인 것만 필터링
          setPinnedItems(result.data.filter(item => !item.isEventEnded))
        }
      } else {
        setPinnedItems([])
      }
    } catch (error) {
      setPinnedItems([])
    }
  }, [activeTab])

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    setCurrentPage(0)
    fetchData(0)
    fetchPinnedData()
  }, [activeTab, fetchData, fetchPinnedData])

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchData(currentPage)
  }, [currentPage, fetchData])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공지사항 & 이벤트</h1>
          <p className="text-gray-600 mt-2">
            다모아의 최신 소식과 이벤트를 확인하세요
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/notices/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <FiCalendar className="text-xl" />
            글쓰기
          </Link>
        )}
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange('notice')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notice'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiBell className="text-lg" />
              공지사항
              {activeTab === 'notice' && totalElements > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalElements}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('event')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'event'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiCalendar className="text-lg" />
              이벤트
              {activeTab === 'event' && totalElements > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalElements}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('ended')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ended'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiArchive className="text-lg" />
              종료된 이벤트
              {activeTab === 'ended' && totalElements > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalElements}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* 고정된 항목 */}
        {pinnedItems.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-100">
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-yellow-600">📌</span>
                고정된 {activeTab === 'notice' ? '공지사항' : '이벤트'}
              </h3>
              <div className="space-y-2">
                {pinnedItems.map((item) => (
                  <Link
                    key={item.uuid}
                    href={`/notices/${item.uuid}`}
                    className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0 w-20 h-20 bg-gray-200 rounded overflow-hidden">
                        <Image
                          src={item.thumbnail?.fileUrl || '/images/img-placeholder.png'}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock />
                            {formatDate(item.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiEye />
                            {item.viewCount}
                          </span>
                          {item.eventStartDate && item.eventEndDate && (
                            <span className="text-blue-600 font-medium">
                              {new Date(item.eventStartDate).toLocaleDateString()} ~ {new Date(item.eventEndDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 목록 */}
        <div className="p-6 min-h-[600px]">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-4 text-6xl">📭</div>
              <p className="text-gray-500 text-lg font-medium">
                {activeTab === 'notice' && '등록된 공지사항이 없습니다.'}
                {activeTab === 'event' && '진행 중인 이벤트가 없습니다.'}
                {activeTab === 'ended' && '종료된 이벤트가 없습니다.'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {activeTab === 'notice' && '새로운 공지사항이 등록되면 여기에 표시됩니다.'}
                {activeTab === 'event' && '진행 중인 이벤트가 없습니다.'}
                {activeTab === 'ended' && '종료된 이벤트가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <Link
                    key={item.uuid}
                    href={`/notices/${item.uuid}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all"
                  >
                    <div className="flex gap-4">
                      {/* 썸네일 */}
                      <div className="relative flex-shrink-0 w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={item.thumbnail?.fileUrl || '/images/img-placeholder.png'}
                          alt={item.title}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
                          {item.title}
                        </h3>

                        {/* 이벤트 기간 */}
                        {item.boardType === 'EVENT' && item.eventStartDate && item.eventEndDate && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                              item.isEventEnded
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {item.isEventEnded ? '종료' : '진행 중'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(item.eventStartDate).toLocaleDateString()} ~ {new Date(item.eventEndDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* 태그 */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 메타 정보 */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock />
                            {formatDate(item.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiEye />
                            조회 {item.viewCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 0 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    이전
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i
                      } else if (currentPage < 3) {
                        pageNum = i
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 5 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
