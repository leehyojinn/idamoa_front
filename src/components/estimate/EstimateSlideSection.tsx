'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getEstimateRequests, type EstimateRequest } from '@/lib/api/estimate'

export default function EstimateSlideSection() {
  const router = useRouter()
  const [estimates, setEstimates] = useState<EstimateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const result = await getEstimateRequests(0, 15, 'createdAt,desc')
        if (result.success && result.data) {
          setEstimates(result.data.content)
        }
      } catch (error) {
        // API 에러는 errorHandler에서 처리
      } finally {
        setLoading(false)
      }
    }

    fetchEstimates()
  }, [])

  // 스크롤 이벤트 감지하여 힌트 숨기기
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || loading || estimates.length === 0) return

    const handleScroll = () => {
      try {
        if (container && container.scrollLeft > 10) {
          setShowSwipeHint(false)
        }
      } catch {
        // 에러 무시
      }
    }

    // scroll과 touchmove 이벤트 모두 사용
    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('touchmove', handleScroll, { passive: true })

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
        container.removeEventListener('touchmove', handleScroll)
      }
    }
  }, [loading, estimates.length])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const now = new Date()
    const expiry = expiresAt ? new Date(expiresAt) : null

    if (status === 'COMPLETED' || (expiry && expiry < now)) {
      return <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">마감</span>
    }
    if (status === 'IN_PROGRESS' || status === 'PUBLISHED') {
      return <span className="px-2 py-1 rounded text-xs bg-primary-100 text-primary">진행중</span>
    }
    return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">접수중</span>
  }

  if (loading || estimates.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <p className="inline-block text-gray-800 text-lg bg-primary-100/80 mx-auto px-6 py-1 rounded-full shadow-md mb-3">
            인테리어 전문 매칭 플랫폼
          </p>
          <h2 className="text-3xl md:text-4xl mb-6 text-gray-800 font-bold">
            내게 딱 맞는 인테리어,<br />한 번에 찾으세요!
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={() => router.push('/estimates/create')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full text-lg w-[275px]"
            >
              <span>⚡</span>
              <span>견적 의뢰하기</span>
            </button>
            <button
              onClick={() => router.push('/estimates')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-full text-lg w-[275px]"
            >
              <span>💼</span>
              <span>제안하기 (인테리어업체)</span>
            </button>
          </div>
          <p className="text-gray-800 text-lg max-w-2xl mx-auto">
            지역별, 스타일별로 원하는 업체를 빠르게 찾고<br />
            한 곳에서 쉽고 투명하게 비교해보세요.
          </p>
        </div>

        {/* 슬라이드 테이블 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 relative">
          {/* 스와이프 힌트 (모바일에만 표시, 스크롤 시 숨김) */}
          <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 flex items-center justify-center md:hidden transition-opacity duration-500 ${showSwipeHint ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[10px] font-medium">스와이프</span>
            </div>
          </div>

          <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* 테이블 헤더 */}
            <div className="bg-primary text-white min-w-[800px]">
              <div className="flex items-center text-sm font-semibold">
                <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center">No</div>
                <div className="flex-1 min-w-[200px] px-4 py-3 text-left">제목</div>
                <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center">신청일</div>
                <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center">마감일</div>
                <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center">조회수</div>
                <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center">입찰수</div>
                <div className="w-[80px] flex-shrink-0 px-2 py-3 text-center">상태</div>
              </div>
            </div>

            {/* 슬라이드 컨테이너 */}
            <div className="relative h-[250px] overflow-y-hidden overflow-x-visible min-w-[800px]">
              <div className="absolute inset-0 animate-scroll-vertical hover:pause">
                {/* 첫 번째 세트 */}
                <div className="min-w-[800px]">
                  {estimates.map((estimate, index) => (
                    <div
                      key={`first-${estimate.id}`}
                      onClick={() => router.push(`/estimates/${estimate.uuid}`)}
                      className="flex items-center text-sm border-b border-gray-200 hover:bg-gray-50/70 transition-colors cursor-pointer"
                    >
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">{estimates.length - index}</div>
                      <div className="flex-1 min-w-[200px] px-4 py-3 text-left text-gray-900 hover:text-primary transition-colors truncate">
                        {estimate.title}
                      </div>
                      <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center text-gray-600">
                        {formatDate(estimate.createdAt)}
                      </div>
                      <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center text-gray-600">
                        {estimate.expiresAt ? formatDate(estimate.expiresAt) : '-'}
                      </div>
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">
                        {estimate.viewCount || 0}
                      </div>
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">
                        {estimate.proposalCount || 0}
                      </div>
                      <div className="w-[80px] flex-shrink-0 px-2 py-3 text-center">
                        {getStatusBadge(estimate.status, estimate.expiresAt)}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 두 번째 세트 (무한 스크롤용) */}
                <div className="min-w-[800px]">
                  {estimates.map((estimate, index) => (
                    <div
                      key={`second-${estimate.id}`}
                      onClick={() => router.push(`/estimates/${estimate.uuid}`)}
                      className="flex items-center text-sm border-b border-gray-200 hover:bg-gray-50/70 transition-colors cursor-pointer"
                    >
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">{estimates.length - index}</div>
                      <div className="flex-1 min-w-[200px] px-4 py-3 text-left text-gray-900 hover:text-primary transition-colors truncate">
                        {estimate.title}
                      </div>
                      <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center text-gray-600">
                        {formatDate(estimate.createdAt)}
                      </div>
                      <div className="w-[110px] flex-shrink-0 px-2 py-3 text-center text-gray-600">
                        {estimate.expiresAt ? formatDate(estimate.expiresAt) : '-'}
                      </div>
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">
                        {estimate.viewCount || 0}
                      </div>
                      <div className="w-[60px] flex-shrink-0 px-2 py-3 text-center text-gray-700">
                        {estimate.proposalCount || 0}
                      </div>
                      <div className="w-[80px] flex-shrink-0 px-2 py-3 text-center">
                        {getStatusBadge(estimate.status, estimate.expiresAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
          {/* 더보기 버튼 */}
          <div className="text-center py-6">
            <button
              onClick={() => router.push('/estimates')}
              className="text-primary hover:text-primary/80 border border-primary/30 transition-colors bg-white px-6 py-2 rounded-full"
            >
              더 많은 입찰 보기 →
            </button>
          </div>
      </div>
    </section>
  )
}
