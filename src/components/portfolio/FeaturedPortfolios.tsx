'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronLeft, FiChevronRight, FiStar, FiEye } from 'react-icons/fi'
import { getFeaturedPortfolios, type PortfolioListItem } from '@/lib/api/portfolio'
import { showErrorToast } from '@/lib/errorHandler'
import { getCdnUrl } from '@/lib/utils'

interface Props {
  count?: number
}

export default function FeaturedPortfolios({ count = 8 }: Props) {
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 반응형: 화면 크기에 따라 보여줄 아이템 수
  const [itemsPerView, setItemsPerView] = useState(4)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1)
      } else if (window.innerWidth < 768) {
        setItemsPerView(2)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3)
      } else {
        setItemsPerView(4)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await getFeaturedPortfolios({ count })
        if (response.success && response.data) {
          setPortfolios(response.data)
        }
      } catch (err) {
        showErrorToast(err, '우대 포트폴리오를 불러오는데 실패했습니다')
        setError('우대 포트폴리오를 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [count])

  const maxIndex = Math.max(0, portfolios.length - itemsPerView)

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }, [maxIndex])

  // 자동 슬라이드
  useEffect(() => {
    if (portfolios.length <= itemsPerView) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= maxIndex) return 0
        return prev + 1
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [portfolios.length, itemsPerView, maxIndex])

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">추천 포트폴리오</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error || portfolios.length === 0) {
    return null // 에러나 데이터 없으면 섹션 숨김
  }

  return (
    <section className="py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-yellow-500">⭐</span>
              추천 포트폴리오
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              엄선된 인테리어 업체의 포트폴리오를 확인해보세요
            </p>
          </div>

          {/* 네비게이션 버튼 (PC) */}
          {portfolios.length > itemsPerView && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* 슬라이더 */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {portfolios.map((portfolio, index) => {
              // 현재 보이는 이미지 + 다음에 보일 이미지들을 priority 로딩
              const isVisible = index >= currentIndex && index < currentIndex + itemsPerView
              const isNextUp = index >= currentIndex + itemsPerView && index < currentIndex + itemsPerView + 2
              const isPriority = isVisible || isNextUp

              return (
              <div
                key={portfolio.uuid}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <Link
                  href={`/portfolios/${portfolio.uuid}`}
                  className="block group"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-gray-200">
                    {/* Shimmer 로딩 효과 */}
                    <div
                      className="absolute inset-0 animate-shimmer z-0"
                      style={{
                        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    {/* 이미지 */}
                    <Image
                      src={getCdnUrl(portfolio.thumbnailUrl || portfolio.images?.[0]?.thumbnailUrl || portfolio.images?.[0]?.fileUrl) || '/images/img-placeholder.png'}
                      alt={portfolio.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                      priority={isPriority}
                      loading={isPriority ? undefined : "lazy"}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThlZiIvPjwvc3ZnPg=="
                    />

                    {/* 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* 우대 배지 */}
                    {portfolio.promotion && (
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        portfolio.promotion.promotionType === 'PREMIUM'
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-primary-500 to-primary-1000 text-white'
                      }`}>
                        {portfolio.promotion.promotionType === 'PREMIUM' ? '🔥 PREMIUM' : '✨ 추천'}
                      </span>
                    )}

                    {/* 조회수 */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <FiEye className="w-3 h-3" />
                      {portfolio.viewCount}
                    </div>

                    {/* 하단 정보 (호버 시) */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-[rgba(0,0,0,0.8)] z-20">
                      <h3 className="text-white font-bold text-lg line-clamp-1 drop-shadow-lg">
                        {portfolio.title}
                      </h3>
                      {portfolio.company && (
                        <div className="flex items-center gap-2 mt-1 text-white/90 text-sm">
                          <span>{portfolio.company.companyName}</span>
                          {portfolio.company.averageRating && (
                            <span className="flex items-center gap-1">
                              <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {portfolio.company.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 하단 정보 (기본) */}
                  <div className="mt-3 px-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {portfolio.title}
                    </h3>
                    {portfolio.company && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span>{portfolio.company.companyName}</span>
                        {portfolio.company.averageRating && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <FiStar className="w-3 h-3 fill-yellow-400" />
                            {portfolio.company.averageRating.toFixed(1)}
                            <span className="text-gray-400">
                              ({portfolio.company.reviewCount})
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              )
            })}
          </div>
        </div>

        {/* 인디케이터 (모바일) */}
        {portfolios.length > itemsPerView && (
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {[...Array(maxIndex + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentIndex === i ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
