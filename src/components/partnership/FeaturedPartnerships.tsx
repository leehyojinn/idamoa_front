'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronLeft, FiChevronRight, FiStar, FiPhone, FiMapPin, FiCheckCircle } from 'react-icons/fi'
import { getActivePartnerships } from '@/lib/api/partnership'
import type { CompanyPartnershipListItem } from '@/types/partnership'
import { showErrorToast } from '@/lib/errorHandler'

interface Props {
  count?: number
}

export default function FeaturedPartnerships({ count = 8 }: Props) {
  const [partnerships, setPartnerships] = useState<CompanyPartnershipListItem[]>([])
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
        const response = await getActivePartnerships()
        if (response.success && response.data) {
          // count 수만큼 자르기
          setPartnerships(response.data.slice(0, count))
        }
      } catch (err) {
        showErrorToast(err, '제휴업체를 불러오는데 실패했습니다')
        setError('제휴업체를 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [count])

  const maxIndex = Math.max(0, partnerships.length - itemsPerView)

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }, [maxIndex])

  // 자동 슬라이드
  useEffect(() => {
    if (partnerships.length <= itemsPerView) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= maxIndex) return 0
        return prev + 1
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [partnerships.length, itemsPerView, maxIndex])

  if (isLoading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">제휴 업체</h2>
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

  if (error || partnerships.length === 0) {
    return null // 에러나 데이터 없으면 섹션 숨김
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">🤝</span>
              제휴 업체
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              인테리어 다모아의 파트너 업체를 확인해보세요
            </p>
          </div>

          {/* 네비게이션 버튼 (PC) */}
          {partnerships.length > itemsPerView && (
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
            {partnerships.map((company, index) => {
              const profileImage = company.images?.find(img => img.imageType === 'PROFILE') || company.images?.[0]
              // 현재 보이는 이미지 + 다음에 보일 이미지들을 priority 로딩
              const isVisible = index >= currentIndex && index < currentIndex + itemsPerView
              const isNextUp = index >= currentIndex + itemsPerView && index < currentIndex + itemsPerView + 2
              const isPriority = isVisible || isNextUp

              return (
                <div
                  key={company.companyUuid}
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <Link
                    href={`/companies/${company.companySlug}`}
                    className="block group"
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-gray-200">
                      {/* 이미지 */}
                      <Image
                        src={profileImage?.imageUrl || '/images/img-placeholder.png'}
                        alt={company.companyName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={isPriority}
                        loading={isPriority ? undefined : "lazy"}
                      />

                      {/* 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* 인증 배지 */}
                      {company.verified && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg bg-green-500 text-white flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          인증업체
                        </span>
                      )}

                      {/* 프리미엄 배지 */}
                      {company.isPremium && (
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
                          {company.premiumTier || 'PREMIUM'}
                        </span>
                      )}

                      {/* 하단 정보 (호버 시) */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                        <h3 className="text-white font-bold text-lg line-clamp-1 drop-shadow-lg">
                          {company.companyName}
                        </h3>
                        {company.address && (
                          <div className="flex items-center gap-1 mt-1 text-white/90 text-sm">
                            <FiMapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{company.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 하단 정보 (기본) */}
                    <div className="mt-3 px-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {company.companyName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        {company.avgRating && company.avgRating > 0 ? (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <FiStar className="w-3 h-3 fill-yellow-400" />
                            {company.avgRating.toFixed(1)}
                            <span className="text-gray-400">
                              ({company.reviewCount})
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">리뷰 없음</span>
                        )}
                        {company.completedProjects > 0 && (
                          <span className="text-gray-400 text-xs">
                            · 시공 {company.completedProjects}건
                          </span>
                        )}
                      </div>
                      {company.companyDescription && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {company.companyDescription}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* 인디케이터 (모바일) */}
        {partnerships.length > itemsPerView && (
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {[...Array(maxIndex + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentIndex === i ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
