'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { FiArrowLeft, FiRefreshCw, FiSearch, FiEye, FiHeart, FiTrash2 } from 'react-icons/fi'
import { adminGetAllPortfolios, adminDeletePortfolio, type PortfolioListItem } from '@/lib/api/portfolio'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminPortfoliosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isInitialLoadRef = useRef(true)

  // URL에서 초기값 읽기
  const getInitialPage = () => parseInt(searchParams.get('page') || '0', 10)
  const getInitialKeyword = () => searchParams.get('keyword') || ''

  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState(getInitialKeyword())
  const [searchKeyword, setSearchKeyword] = useState(getInitialKeyword())
  const [currentPage, setCurrentPage] = useState(getInitialPage())
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // URL 업데이트 함수
  const updateURL = useCallback((params: {
    page?: number
    keyword?: string
  }) => {
    const urlParams = new URLSearchParams()
    const newPage = params.page ?? currentPage
    const newKeyword = params.keyword ?? searchKeyword

    if (newPage > 0) urlParams.set('page', newPage.toString())
    if (newKeyword) urlParams.set('keyword', newKeyword)

    const queryString = urlParams.toString()
    const basePath = pathname || '/admin/portfolios'
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath
    router.replace(newUrl, { scroll: false })
  }, [currentPage, searchKeyword, pathname, router])

  const fetchPortfolios = async () => {
    setIsLoading(true)
    try {
      const response = await adminGetAllPortfolios({
        keyword: searchKeyword || undefined,
        page: currentPage,
        size: 20,
        sort: 'createdAt,DESC',
      })
      if (response.success && response.data) {
        setPortfolios(response.data.content)
        setTotalPages(response.data.totalPages)
        setTotalElements(response.data.totalElements)
      }
    } catch (error) {
      showErrorToast(error, '포트폴리오 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolios()
  }, [searchKeyword, currentPage])

  const handleSearch = () => {
    setCurrentPage(0)
    setSearchKeyword(keyword)
    updateURL({ keyword, page: 0 })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ page })
  }

  // URL 변경 감지 (뒤로가기/앞으로가기)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    const urlPage = parseInt(searchParams.get('page') || '0', 10)
    const urlKeyword = searchParams.get('keyword') || ''

    const needsUpdate = urlPage !== currentPage || urlKeyword !== searchKeyword

    if (needsUpdate) {
      setCurrentPage(urlPage)
      setKeyword(urlKeyword)
      setSearchKeyword(urlKeyword)
    }
  }, [searchParams])

  const handleDelete = async (portfolio: PortfolioListItem) => {
    if (!confirm(`정말로 "${portfolio.title}" 포트폴리오를 삭제하시겠습니까?`)) return

    try {
      await adminDeletePortfolio(portfolio.uuid)
      showSuccessToast('포트폴리오가 삭제되었습니다.')
      fetchPortfolios()
    } catch (error) {
      showErrorToast(error, '포트폴리오 삭제에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">포트폴리오 관리</h1>
              <p className="text-gray-600">총 {totalElements}개의 포트폴리오</p>
            </div>
          </div>
          <button
            onClick={fetchPortfolios}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 검색 */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제목/내용 검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            검색
          </button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">포트폴리오가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    포트폴리오
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업체
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    우대
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolios.map((portfolio) => (
                  <tr key={portfolio.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        {portfolio.images && portfolio.images.length > 0 && (
                          <Image
                            src={portfolio.thumbnailUrl || portfolio.images[0].fileUrl}
                            alt={portfolio.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/portfolios/${portfolio.uuid}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:text-primary block truncate"
                            title={portfolio.title}
                          >
                            {portfolio.title}
                          </Link>
                          {portfolio.tags && portfolio.tags.length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {portfolio.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(portfolio.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {portfolio.company?.companyName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {portfolio.images?.length || 0}개
                        {portfolio.images && portfolio.images.length > 0 && (
                          <div className="text-xs text-gray-400">
                            {formatFileSize(
                              portfolio.images.reduce((sum, f) => sum + f.fileSize, 0)
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FiEye className="w-4 h-4" />
                          {portfolio.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiHeart className="w-4 h-4" />
                          {portfolio.likeCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {portfolio.promotion ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          portfolio.promotion.promotionType === 'PREMIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {portfolio.promotion.promotionType === 'PREMIUM' ? '강력우대' : '일반우대'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/portfolios/${portfolio.uuid}`}
                        target="_blank"
                        className="text-primary hover:text-primary"
                      >
                        보기
                      </Link>
                      <Link
                        href={`/admin/portfolios/${portfolio.uuid}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(portfolio)}
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
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
