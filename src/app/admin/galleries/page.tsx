'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getAdminGalleries,
  deleteAdminGallery,
  toggleAdminPublish,
  toggleAdminPin,
  toggleAdminFeature,
  type AdminGalleryBoard,
} from '@/lib/api/gallery'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<AdminGalleryBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchGalleries = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminGalleries({
        keyword: searchKeyword || undefined,
        page: 0,
        size: 50,
        sort: 'publishedAt,DESC',
      })
      setGalleries(data.content)
    } catch (error) {
      showErrorToast(error, '사진 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGalleries()
  }, [searchKeyword])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleDelete = async (gallery: AdminGalleryBoard) => {
    if (!confirm(`정말로 "${gallery.title}" 게시글을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminGallery(gallery.uuid)
      showSuccessToast('게시글이 삭제되었습니다.')
      fetchGalleries()
    } catch (error) {
      showErrorToast(error, '게시글 삭제에 실패했습니다.')
    }
  }

  const handleTogglePublish = async (gallery: AdminGalleryBoard) => {
    try {
      await toggleAdminPublish(gallery.uuid)
      await fetchGalleries()
      showSuccessToast(`게시글이 ${gallery.isPublished ? '게시 취소' : '게시'}되었습니다.`)
    } catch (error) {
      showErrorToast(error, '게시 상태 변경에 실패했습니다.')
    }
  }

  const handleTogglePin = async (gallery: AdminGalleryBoard) => {
    try {
      await toggleAdminPin(gallery.uuid)
      await fetchGalleries()
      showSuccessToast(`게시글이 ${gallery.isPinned ? '고정 해제' : '고정'}되었습니다.`)
    } catch (error) {
      showErrorToast(error, '고정 상태 변경에 실패했습니다.')
    }
  }

  const handleToggleFeature = async (gallery: AdminGalleryBoard) => {
    try {
      await toggleAdminFeature(gallery.uuid)
      await fetchGalleries()
      showSuccessToast(`게시글이 ${gallery.isFeatured ? '추천 해제' : '추천'}되었습니다.`)
    } catch (error) {
      showErrorToast(error, '추천 상태 변경에 실패했습니다.')
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사진 관리</h1>
          <Link
            href="/admin/galleries/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 게시글 추가
          </Link>
        </div>

        {/* 검색 */}
        <div className="flex gap-4 mb-6">
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

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {galleries.map((gallery) => (
                  <tr key={gallery.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        {gallery.images.length > 0 && (
                          <img
                            src={gallery.images[0].fileUrl}
                            alt={gallery.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <Link
                            href={`/admin/galleries/${gallery.uuid}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {gallery.title}
                          </Link>
                          {gallery.isPinned && (
                            <span className="ml-2 text-red-600">📌</span>
                          )}
                          {gallery.isFeatured && (
                            <span className="ml-2 text-yellow-600">⭐</span>
                          )}
                          {gallery.tags.length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {gallery.tags.map((tag) => (
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
                      {gallery.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {gallery.images.length}개
                        <div className="text-xs text-gray-400">
                          {formatFileSize(
                            gallery.images.reduce((sum, f) => sum + f.fileSize, 0)
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <div>조회 {gallery.viewCount}</div>
                        <div>좋아요 {gallery.likeCount}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleTogglePublish(gallery)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            gallery.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {gallery.isPublished ? '게시중' : '미게시'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleTogglePin(gallery)}
                        className={`${
                          gallery.isPinned ? 'text-red-600' : 'text-gray-400'
                        } hover:text-red-900`}
                        title={gallery.isPinned ? '고정 해제' : '고정'}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleToggleFeature(gallery)}
                        className={`${
                          gallery.isFeatured ? 'text-yellow-600' : 'text-gray-400'
                        } hover:text-yellow-900`}
                        title={gallery.isFeatured ? '추천 해제' : '추천'}
                      >
                        ⭐
                      </button>
                      <Link
                        href={`/admin/galleries/${gallery.uuid}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(gallery)}
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
      </div>
      <Footer />
    </AdminGuard>
  )
}
