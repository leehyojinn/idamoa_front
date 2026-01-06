'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getEstimateRequests,
  deleteEstimateRequest,
  changeEstimateRequestStatus,
  getProposals,
  deleteProposal,
  type EstimateRequestListItem,
  type ProposalResponse,
} from '@/lib/api/admin-estimate'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

type TabType = 'requests' | 'proposals'

export default function AdminEstimatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('requests')
  const [requests, setRequests] = useState<EstimateRequestListItem[]>([])
  const [proposals, setProposals] = useState<ProposalResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  // 페이징 - 견적 요청
  const [reqCurrentPage, setReqCurrentPage] = useState(0)
  const [reqTotalPages, setReqTotalPages] = useState(0)
  const [reqTotalElements, setReqTotalElements] = useState(0)

  // 페이징 - 견적 제안
  const [propCurrentPage, setPropCurrentPage] = useState(0)
  const [propTotalPages, setPropTotalPages] = useState(0)
  const [propTotalElements, setPropTotalElements] = useState(0)

  const pageSize = 20

  const fetchRequests = async (page: number = reqCurrentPage) => {
    setIsLoading(true)
    try {
      const data = await getEstimateRequests({
        status: statusFilter as any || undefined,
        page,
        size: pageSize,
        sort: 'createdAt,DESC',
      })
      // 삭제된 항목 제외
      const filteredRequests = data.content.filter(req => !req.isDeleted)
      setRequests(filteredRequests)
      setReqTotalPages(data.totalPages)
      setReqTotalElements(data.totalElements)
    } catch (error) {
      showErrorToast(error, '견적 요청 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProposals = async (page: number = propCurrentPage) => {
    setIsLoading(true)
    try {
      const data = await getProposals({
        page,
        size: pageSize,
        sort: 'createdAt,DESC',
      })
      // 삭제된 항목 제외
      setProposals(data.content.filter(prop => !prop.isDeleted))
      setPropTotalPages(data.totalPages)
      setPropTotalElements(data.totalElements)
    } catch (error) {
      showErrorToast(error, '견적 제안 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests(reqCurrentPage)
    } else {
      fetchProposals(propCurrentPage)
    }
  }, [activeTab, statusFilter, reqCurrentPage, propCurrentPage])

  // 필터 변경 시 페이지 초기화
  const handleStatusFilterChange = (value: string) => {
    setReqCurrentPage(0)
    setStatusFilter(value)
  }

  const handleDeleteRequest = async (request: EstimateRequestListItem) => {
    if (!confirm(`정말로 "${request.title}" 견적 요청을 삭제하시겠습니까?`)) return

    try {
      await deleteEstimateRequest(request.uuid)
      showSuccessToast('견적 요청이 삭제되었습니다.')
      fetchRequests()
    } catch (error) {
      showErrorToast(error, '견적 요청 삭제에 실패했습니다.')
    }
  }

  const handleChangeStatus = async (request: EstimateRequestListItem, status: string) => {
    try {
      await changeEstimateRequestStatus(request.uuid, status as any)
      showSuccessToast('상태가 변경되었습니다.')
      fetchRequests()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleDeleteProposal = async (proposal: ProposalResponse) => {
    if (!confirm(`정말로 "${proposal.title}" 견적 제안을 삭제하시겠습니까?`)) return

    try {
      await deleteProposal(proposal.uuid)
      showSuccessToast('견적 제안이 삭제되었습니다.')
      fetchProposals()
    } catch (error) {
      showErrorToast(error, '견적 제안 삭제에 실패했습니다.')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return '게시됨'
      case 'CANCELLED':
        return '취소됨'
      case 'COMPLETED':
        return '완료됨'
      default:
        return status
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">견적 관리</h1>

        {/* 탭 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              견적 요청
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`${
                activeTab === 'proposals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              견적 제안
            </button>
          </nav>
        </div>

        {/* 견적 요청 탭 */}
        {activeTab === 'requests' && (
          <>
            {/* 필터 */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mr-2">상태 필터:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="PUBLISHED">게시됨</option>
                <option value="CANCELLED">취소됨</option>
                <option value="COMPLETED">완료됨</option>
              </select>
            </div>

            {/* 목록 */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">견적 요청이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        위치
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        예산
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제안수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        조회수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        만료일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.id}
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <Link
                            href={`/admin/estimates/${request.uuid}`}
                            className="font-medium text-gray-900 hover:text-blue-600 block truncate"
                            title={request.title}
                          >
                            {request.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.location || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.budgetMin ? request.budgetMin.toLocaleString() : '0'} ~ {request.budgetMax ? request.budgetMax.toLocaleString() : '0'}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.proposalCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.viewCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={request.status}
                            onChange={(e) => handleChangeStatus(request, e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(request.status)}`}
                          >
                            <option value="PUBLISHED">게시됨</option>
                            <option value="CANCELLED">취소됨</option>
                            <option value="COMPLETED">완료됨</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            href={`/admin/estimates/${request.uuid}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            상세
                          </Link>
                          <button
                            onClick={() => handleDeleteRequest(request)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이징 */}
                {reqTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      총 {reqTotalElements}개 중 {reqCurrentPage * pageSize + 1}-{Math.min((reqCurrentPage + 1) * pageSize, reqTotalElements)}개
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReqCurrentPage(0)}
                        disabled={reqCurrentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        처음
                      </button>
                      <button
                        onClick={() => setReqCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={reqCurrentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        이전
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {reqCurrentPage + 1} / {reqTotalPages}
                      </span>
                      <button
                        onClick={() => setReqCurrentPage(prev => Math.min(reqTotalPages - 1, prev + 1))}
                        disabled={reqCurrentPage >= reqTotalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => setReqCurrentPage(reqTotalPages - 1)}
                        disabled={reqCurrentPage >= reqTotalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        마지막
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 견적 제안 탭 */}
        {activeTab === 'proposals' && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">견적 제안이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        업체명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        견적 요청
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        선택됨
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        유효기간
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <tr key={proposal.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proposal.id}
                        </td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <div className="font-medium text-gray-900 truncate" title={proposal.title}>
                            {proposal.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[150px]">
                          <div className="text-sm text-gray-500 truncate" title={proposal.companyName}>
                            {proposal.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[180px]">
                          <Link
                            href={`/admin/estimates/${proposal.requestUuid}`}
                            className="text-blue-600 hover:text-blue-900 text-sm block truncate"
                            title={proposal.requestTitle}
                          >
                            {proposal.requestTitle}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proposal.price ? proposal.price.toLocaleString() : '0'}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proposal.isSelected ? '✓' : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {proposal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(proposal.validUntil).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteProposal(proposal)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이징 */}
                {propTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      총 {propTotalElements}개 중 {propCurrentPage * pageSize + 1}-{Math.min((propCurrentPage + 1) * pageSize, propTotalElements)}개
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPropCurrentPage(0)}
                        disabled={propCurrentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        처음
                      </button>
                      <button
                        onClick={() => setPropCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={propCurrentPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        이전
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {propCurrentPage + 1} / {propTotalPages}
                      </span>
                      <button
                        onClick={() => setPropCurrentPage(prev => Math.min(propTotalPages - 1, prev + 1))}
                        disabled={propCurrentPage >= propTotalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => setPropCurrentPage(propTotalPages - 1)}
                        disabled={propCurrentPage >= propTotalPages - 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        마지막
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
