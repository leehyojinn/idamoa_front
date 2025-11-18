'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { getCompanies, toggleCompanyLike, type CompanyListItem } from '@/lib/api/company'
import { useAuthStore } from '@/stores/authStore'
import {
  IoStar,
  IoEye,
  IoHeart,
  IoHeartOutline,
  IoCheckmarkCircle,
  IoLocationOutline,
  IoCallOutline,
} from 'react-icons/io5'

const SORT_OPTIONS = [
  { value: 'createdAt,DESC', label: '최신순' },
  { value: 'avgRating,DESC', label: '평점 높은 순' },
  { value: 'reviewCount,DESC', label: '리뷰 많은 순' },
  { value: 'likeCount,DESC', label: '좋아요 많은 순' },
  { value: 'viewCount,DESC', label: '인기순' },
]

export default function CompanyList() {
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt,DESC')

  useEffect(() => {
    fetchCompanies()
  }, [page, sortBy])

  const fetchCompanies = async () => {
    setLoading(true)

    try {
      const result = await getCompanies({
        page,
        size: 12,
        sort: sortBy,
      })

      if (result.success && result.data) {
        setCompanies(result.data.content)
        setTotalPages(result.data.totalPages)
        setTotalElements(result.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '업체 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setPage(0)
  }

  const handleCompanyClick = (slug: string) => {
    router.push(`/companies/${slug}`)
  }

  const handleLikeClick = async (e: React.MouseEvent, companyUuid: string, currentIsLiked: boolean) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지

    // 로그인 체크
    if (!accessToken) {
      showErrorToast(null, '로그인이 필요합니다')
      router.push('/login')
      return
    }

    try {
      const result = await toggleCompanyLike(companyUuid)

      if (result.success) {
        // 상태 업데이트
        setCompanies(prevCompanies =>
          prevCompanies.map(company =>
            company.uuid === companyUuid
              ? {
                  ...company,
                  isLiked: result.data.isLiked,
                  likeCount: result.data.isLiked
                    ? company.likeCount + 1
                    : company.likeCount - 1,
                }
              : company
          )
        )
        showSuccessToast(result.data.message)
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리 중 오류가 발생했습니다')
    }
  }

  const getPrimaryImage = (images: any[]) => {
    return images.find((img) => img.isPrimary)?.imageUrl || images[0]?.imageUrl || '/images/img-placeholder.png'
  }

  return (
    <div className="w-full bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">추천 업체</h2>
            <p className="mt-2 text-sm text-gray-600">
              총 {totalElements.toLocaleString()}개의 업체
            </p>
          </div>

          {/* 정렬 옵션 */}
          <div className="mt-4 sm:mt-0 w-full sm:w-auto">
            <Select
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={handleSortChange}
              className="min-w-[200px]"
            />
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">등록된 업체가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 업체 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company.uuid}
                  onClick={() => handleCompanyClick(company.slug)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
                >
                  {/* 이미지 */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <Image
                      src={getPrimaryImage(company.images)}
                      alt={company.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* 프리미엄 배지 */}
                    {company.isPremium && company.premiumTier && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`
                          px-3 py-1 rounded-full text-xs font-bold text-white shadow-md
                          ${
                            company.premiumTier === 'GOLD'
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : company.premiumTier === 'SILVER'
                              ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                              : 'bg-gradient-to-r from-orange-400 to-orange-600'
                          }
                        `}
                        >
                          {company.premiumTier}
                        </span>
                      </div>
                    )}

                    {/* 추천 배지 */}
                    {company.featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                          추천
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="p-5">
                    {/* 업체명 */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {company.name}
                      </h3>
                      {company.verified && (
                        <IoCheckmarkCircle className="text-blue-500 text-xl flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* 설명 */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {company.description}
                    </p>

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mb-3">
                      <IoStar className="text-yellow-400 text-lg" />
                      <span className="font-semibold text-gray-900">
                        {company.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({company.reviewCount}개 리뷰)
                      </span>
                    </div>

                    {/* 주소 */}
                    {company.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <IoLocationOutline className="text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-1">{company.address}</span>
                      </div>
                    )}

                    {/* 전화번호 */}
                    {company.primaryPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <IoCallOutline className="text-gray-400 flex-shrink-0" />
                        <span>{company.primaryPhone}</span>
                      </div>
                    )}

                    {/* 통계 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <IoEye className="text-gray-400" />
                          <span>{company.viewCount.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={(e) => handleLikeClick(e, company.uuid, company.isLiked)}
                          className="flex items-center gap-1 hover:scale-110 transition-transform"
                        >
                          {company.isLiked ? (
                            <IoHeart className="text-red-500" />
                          ) : (
                            <IoHeartOutline className="text-gray-400 hover:text-red-500" />
                          )}
                          <span>{company.likeCount.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
