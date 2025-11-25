'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getPopups,
  activatePopup,
  deactivatePopup,
  deletePopup,
  type Popup,
  type PageResponse,
} from '@/lib/api/popup'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<PageResponse<Popup> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)

  const fetchPopups = async () => {
    setIsLoading(true)
    try {
      const response = await getPopups({ page, size: 20, sort: 'displayOrder,ASC' })
      if (response.success) {
        setPopups(response.data)
      }
    } catch (error) {
      showErrorToast(error, '팝업 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPopups()
  }, [page])

  const handleToggleActive = async (popup: Popup) => {
    try {
      const response = popup.isActive ? await deactivatePopup(popup.uuid) : await activatePopup(popup.uuid)
      if (response.success) {
        showSuccessToast(popup.isActive ? '팝업이 비활성화되었습니다.' : '팝업이 활성화되었습니다.')
        fetchPopups()
      }
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await deletePopup(uuid)
      if (response.success) {
        showSuccessToast('팝업이 삭제되었습니다.')
        fetchPopups()
      }
    } catch (error) {
      showErrorToast(error, '삭제에 실패했습니다.')
    }
  }

  const getCTR = (popup: Popup) => {
    if (popup.viewCount === 0) return '0%'
    return ((popup.clickCount / popup.viewCount) * 100).toFixed(2) + '%'
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-64px-200px)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">팝업 관리</h1>
            <p className="text-gray-600 mt-1">홈페이지에 표시되는 팝업을 관리합니다.</p>
          </div>
          <Link
            href="/admin/popups/create"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            팝업 생성
          </Link>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : popups?.content.length === 0 ? (
            <div className="p-8 text-center text-gray-500">등록된 팝업이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">순서</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">제목</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">조회수</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">클릭수</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CTR</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">노출기간</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {popups?.content.map((popup) => (
                    <tr key={popup.uuid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {popup.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate font-medium text-gray-900">{popup.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            popup.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {popup.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {popup.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {popup.clickCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getCTR(popup)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="whitespace-nowrap">
                          {popup.displayStartDate
                            ? new Date(popup.displayStartDate).toLocaleDateString('ko-KR')
                            : '제한없음'}
                        </div>
                        <div className="whitespace-nowrap">
                          ~{' '}
                          {popup.displayEndDate
                            ? new Date(popup.displayEndDate).toLocaleDateString('ko-KR')
                            : '제한없음'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/popups/${popup.uuid}/edit`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleToggleActive(popup)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            {popup.isActive ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleDelete(popup.uuid)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {popups && popups.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={popups.first}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {popups.number + 1} / {popups.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={popups.last}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
