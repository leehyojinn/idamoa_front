'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getAdminCompanies,
  deleteAdminCompany,
  changeCompanyStatus,
  verifyCompany,
  type CompanyListItem,
  type AdminCompanyListParams,
} from '@/lib/api/company'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | ''>('')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | ''>('')
  const [featuredFilter, setFeaturedFilter] = useState<boolean | ''>('')

  const fetchCompanies = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: AdminCompanyListParams = {
        page,
        size: 20,
        sort: 'createdAt,DESC',
      }

      const response = await getAdminCompanies(params)
      if (response.success && response.data) {
        setCompanies(response.data.content)
        setTotalPages(response.data.totalPages)
        setCurrentPage(response.data.number)
      }
    } catch (error) {
      showErrorToast(error, '업체 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies(0)
  }, [])

  const handleDelete = async (company: CompanyListItem) => {
    if (!confirm(`정말로 "${company.name}" 업체를 삭제하시겠습니까?`)) return

    try {
      await deleteAdminCompany(company.uuid)
      showSuccessToast('업체가 삭제되었습니다.')
      fetchCompanies(currentPage)
    } catch (error) {
      showErrorToast(error, '업체 삭제에 실패했습니다.')
    }
  }

  const handleStatusChange = async (
    company: CompanyListItem,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ) => {
    try {
      await changeCompanyStatus(company.uuid, status)
      showSuccessToast(`업체 상태가 ${getStatusLabel(status)}(으)로 변경되었습니다.`)
      fetchCompanies(currentPage)
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleVerify = async (company: CompanyListItem) => {
    try {
      await verifyCompany(company.uuid)
      showSuccessToast('업체가 인증되었습니다.')
      fetchCompanies(currentPage)
    } catch (error) {
      showErrorToast(error, '인증 처리에 실패했습니다.')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '활성'
      case 'INACTIVE':
        return '비활성'
      case 'SUSPENDED':
        return '정지'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 필터링된 업체 목록
  const filteredCompanies = companies.filter((company) => {
    // 삭제된 업체 제외
    if (company.isDeleted) return false
    if (statusFilter && company.status !== statusFilter) return false
    if (verifiedFilter !== '' && company.verified !== verifiedFilter) return false
    if (featuredFilter !== '' && company.featured !== featuredFilter) return false
    return true
  })

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">업체 관리</h1>
          <Link
            href="/admin/companies/create"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            + 업체 추가
          </Link>
        </div>

        {/* 필터 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="SUSPENDED">정지</option>
            </select>

            <select
              value={verifiedFilter === '' ? '' : verifiedFilter ? 'true' : 'false'}
              onChange={(e) =>
                setVerifiedFilter(
                  e.target.value === '' ? '' : e.target.value === 'true'
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">전체 인증 상태</option>
              <option value="true">인증됨</option>
              <option value="false">미인증</option>
            </select>

            <select
              value={featuredFilter === '' ? '' : featuredFilter ? 'true' : 'false'}
              onChange={(e) =>
                setFeaturedFilter(
                  e.target.value === '' ? '' : e.target.value === 'true'
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">전체 추천 상태</option>
              <option value="true">추천</option>
              <option value="false">일반</option>
            </select>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">업체가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평점/리뷰
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <tr key={company.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/companies/${company.slug}`}
                            className="font-medium text-gray-900 hover:text-primary"
                            title={company.name}
                          >
                            {company.name}
                          </Link>
                          <div className="flex gap-1 mt-1">
                            {company.verified && (
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded">
                                인증
                              </span>
                            )}
                            {company.featured && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                                추천
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {company.primaryPhone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {company.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <select
                            value={company.status}
                            onChange={(e) =>
                              handleStatusChange(
                                company,
                                e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
                              )
                            }
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              company.status
                            )}`}
                          >
                            <option value="ACTIVE">활성</option>
                            <option value="INACTIVE">비활성</option>
                            <option value="SUSPENDED">정지</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>⭐ {company.avgRating.toFixed(1)}</div>
                          <div className="text-xs text-gray-400">
                            리뷰 {company.reviewCount}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/companies/${company.uuid}/edit`}
                          className="text-primary hover:text-primary"
                        >
                          수정
                        </Link>
                        {!company.verified && (
                          <button
                            onClick={() => handleVerify(company)}
                            className="text-green-600 hover:text-green-900"
                          >
                            인증
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(company)}
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchCompanies(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => fetchCompanies(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </AdminGuard>
  )
}
