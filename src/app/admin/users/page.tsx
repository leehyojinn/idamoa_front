'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  getAdminUsers,
  deleteAdminUser,
  changeUserStatus,
  type UserListItem,
  type GetAdminUsersParams,
} from '@/lib/api/user'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isInitialLoadRef = useRef(true)

  // URL에서 초기값 읽기
  const getInitialPage = () => parseInt(searchParams.get('page') || '0', 10)
  const getInitialKeyword = () => searchParams.get('keyword') || ''
  const getInitialStatus = () => (searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | '') || ''
  const getInitialRole = () => (searchParams.get('role') as 'USER' | 'COMPANY' | 'ADMIN' | '') || ''

  const [users, setUsers] = useState<UserListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(getInitialPage())

  // 필터
  const [keyword, setKeyword] = useState(getInitialKeyword())
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | ''>(getInitialStatus())
  const [roleFilter, setRoleFilter] = useState<'USER' | 'COMPANY' | 'ADMIN' | ''>(getInitialRole())

  // URL 업데이트 함수
  const updateURL = useCallback((params: {
    page?: number
    keyword?: string
    status?: string
    role?: string
  }) => {
    const urlParams = new URLSearchParams()
    const newPage = params.page ?? currentPage
    const newKeyword = params.keyword ?? keyword
    const newStatus = params.status ?? statusFilter
    const newRole = params.role ?? roleFilter

    if (newPage > 0) urlParams.set('page', newPage.toString())
    if (newKeyword) urlParams.set('keyword', newKeyword)
    if (newStatus) urlParams.set('status', newStatus)
    if (newRole) urlParams.set('role', newRole)

    const queryString = urlParams.toString()
    const basePath = pathname || '/admin/users'
    const newUrl = queryString ? `${basePath}?${queryString}` : basePath
    router.replace(newUrl, { scroll: false })
  }, [currentPage, keyword, statusFilter, roleFilter, pathname, router])

  const fetchUsers = async (page: number = 0) => {
    setIsLoading(true)
    try {
      const params: GetAdminUsersParams = {
        page,
        size: 20,
      }

      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      if (roleFilter) params.role = roleFilter

      const response = await getAdminUsers(params)
      if (response.success && response.data) {
        setUsers(response.data.content)
        setTotalPages(response.data.totalPages)
        setCurrentPage(response.data.number)
      }
    } catch (error) {
      showErrorToast(error, '회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(getInitialPage())
  }, [])

  const handleSearch = () => {
    setCurrentPage(0)
    updateURL({ keyword, status: statusFilter, role: roleFilter, page: 0 })
    fetchUsers(0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ page })
    fetchUsers(page)
  }

  // URL 변경 감지 (뒤로가기/앞으로가기)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    const urlPage = parseInt(searchParams.get('page') || '0', 10)
    const urlKeyword = searchParams.get('keyword') || ''
    const urlStatus = (searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | '') || ''
    const urlRole = (searchParams.get('role') as 'USER' | 'COMPANY' | 'ADMIN' | '') || ''

    const needsUpdate = urlPage !== currentPage || urlKeyword !== keyword || urlStatus !== statusFilter || urlRole !== roleFilter

    if (needsUpdate) {
      setCurrentPage(urlPage)
      setKeyword(urlKeyword)
      setStatusFilter(urlStatus)
      setRoleFilter(urlRole)
      fetchUsers(urlPage)
    }
  }, [searchParams])

  const handleDelete = async (user: UserListItem) => {
    if (!confirm(`정말로 "${user.name} (${user.email})" 회원을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminUser(user.uuid)
      showSuccessToast('회원이 삭제되었습니다.')
      fetchUsers(currentPage)
    } catch (error) {
      showErrorToast(error, '회원 삭제에 실패했습니다.')
    }
  }

  const handleStatusChange = async (
    user: UserListItem,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  ) => {
    try {
      await changeUserStatus(user.uuid, { status })
      showSuccessToast(`회원 상태가 ${getStatusLabel(status)}(으)로 변경되었습니다.`)
      fetchUsers(currentPage)
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
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
      case 'PENDING':
        return '대기'
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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (roles: string[]) => {
    return roles.map((role) => {
      switch (role) {
        case 'USER':
          return '사용자'
        case 'COMPANY':
          return '업체'
        case 'ADMIN':
          return '관리자'
        default:
          return role
      }
    }).join(', ')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'USER':
        return 'bg-primary-100 text-primary-800'
      case 'COMPANY':
        return 'bg-purple-100 text-purple-800'
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 삭제된 회원 필터링
  const filteredUsers = users.filter((user) => {
    if (user.isDeleted) return false
    return true
  })

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="이메일 또는 이름 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="SUSPENDED">정지</option>
              <option value="PENDING">대기</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">전체 역할</option>
              <option value="USER">사용자</option>
              <option value="COMPANY">업체</option>
              <option value="ADMIN">관리자</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              검색
            </button>
          </div>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">회원이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회원정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      인증
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      로그인
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/admin/users/${user.uuid}`}
                            className="font-medium text-gray-900 hover:text-primary"
                          >
                            {user.name}
                          </Link>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(role)}`}
                            >
                              {role === 'USER' ? '사용자' : role === 'COMPANY' ? '업체' : '관리자'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.status}
                          onChange={(e) =>
                            handleStatusChange(
                              user,
                              e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
                            )
                          }
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            user.status
                          )}`}
                        >
                          <option value="ACTIVE">활성</option>
                          <option value="INACTIVE">비활성</option>
                          <option value="SUSPENDED">정지</option>
                          <option value="PENDING">대기</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          {user.emailVerified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              이메일
                            </span>
                          )}
                          {user.phoneVerified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              휴대폰
                            </span>
                          )}
                          {user.identityVerified && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded">
                              본인인증
                            </span>
                          )}
                          {!user.emailVerified && !user.phoneVerified && !user.identityVerified && (
                            <span className="text-xs text-gray-400">없음</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{user.loginCount}회</div>
                          {user.lastLoginAt && (
                            <div className="text-xs text-gray-400">
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/users/${user.uuid}`}
                          className="text-primary hover:text-primary"
                        >
                          상세
                        </Link>
                        <button
                          onClick={() => handleDelete(user)}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
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
