'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getDocuments,
  deleteDocument,
  togglePublish,
  togglePin,
  toggleFeature,
} from '@/lib/api/document'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import type { DocumentBoard } from '@/types/document'

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const data = await getDocuments({
        keyword: searchKeyword || undefined,
        page: 0,
        size: 50,
        sort: 'publishedAt,DESC',
      })
      setDocuments(data.content)
    } catch (error) {
      showErrorToast(error, '자료실 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [searchKeyword])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleDelete = async (doc: DocumentBoard) => {
    if (!confirm(`정말로 "${doc.title}" 게시글을 삭제하시겠습니까?`)) return

    try {
      await deleteDocument(doc.uuid)
      showSuccessToast('게시글이 삭제되었습니다.')
      fetchDocuments()
    } catch (error) {
      showErrorToast(error, '게시글 삭제에 실패했습니다.')
    }
  }

  const handleTogglePublish = async (doc: DocumentBoard) => {
    try {
      await togglePublish(doc.uuid)
      await fetchDocuments()
      showSuccessToast(`게시글이 ${doc.isPublished ? '게시 취소' : '게시'}되었습니다.`)
    } catch (error) {
      showErrorToast(error, '게시 상태 변경에 실패했습니다.')
    }
  }

  const handleTogglePin = async (doc: DocumentBoard) => {
    try {
      await togglePin(doc.uuid)
      await fetchDocuments()
      showSuccessToast(`게시글이 ${doc.isPinned ? '고정 해제' : '고정'}되었습니다.`)
    } catch (error) {
      showErrorToast(error, '고정 상태 변경에 실패했습니다.')
    }
  }

  const handleToggleFeature = async (doc: DocumentBoard) => {
    try {
      await toggleFeature(doc.uuid)
      await fetchDocuments()
      showSuccessToast(`게시글이 ${doc.isFeatured ? '추천 해제' : '추천'}되었습니다.`)
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
          <h1 className="text-2xl font-bold text-gray-900">자료실 관리</h1>
          <Link
            href="/admin/documents/new"
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
        ) : documents.length === 0 ? (
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
                    파일
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
                {documents.map((doc) => (
                  <tr key={doc.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        {doc.thumbnail && (
                          <img
                            src={doc.thumbnail.fileUrl}
                            alt={doc.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <Link
                            href={`/admin/documents/${doc.uuid}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {doc.title}
                          </Link>
                          {doc.isPaid && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                              유료 {doc.price.toLocaleString()}원
                            </span>
                          )}
                          {doc.isPinned && (
                            <span className="ml-2 text-red-600">📌</span>
                          )}
                          {doc.isFeatured && (
                            <span className="ml-2 text-yellow-600">⭐</span>
                          )}
                          {doc.tags.length > 0 && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {doc.tags.map((tag) => (
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
                      {doc.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {doc.files.length}개
                        <div className="text-xs text-gray-400">
                          {formatFileSize(
                            doc.files.reduce((sum, f) => sum + f.fileSize, 0)
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        <div>조회 {doc.viewCount}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleTogglePublish(doc)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {doc.isPublished ? '게시중' : '미게시'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleTogglePin(doc)}
                        className={`${
                          doc.isPinned ? 'text-red-600' : 'text-gray-400'
                        } hover:text-red-900`}
                        title={doc.isPinned ? '고정 해제' : '고정'}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleToggleFeature(doc)}
                        className={`${
                          doc.isFeatured ? 'text-yellow-600' : 'text-gray-400'
                        } hover:text-yellow-900`}
                        title={doc.isFeatured ? '추천 해제' : '추천'}
                      >
                        ⭐
                      </button>
                      <Link
                        href={`/admin/documents/${doc.uuid}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(doc)}
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
