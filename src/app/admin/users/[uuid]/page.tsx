'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getAdminUser,
  changeUserStatus,
  changeUserRoles,
  deleteAdminUser,
  type User,
  type ChangeUserStatusRequest,
  type ChangeUserRolesRequest,
} from '@/lib/api/user'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userUuid = params.uuid as string

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 편집 상태
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ACTIVE')
  const [statusReason, setStatusReason] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<('USER' | 'COMPANY' | 'ADMIN')[]>([])

  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const response = await getAdminUser(userUuid)
      if (response.success && response.data) {
        setUser(response.data)
        setSelectedStatus(response.data.status)
        setSelectedRoles(response.data.roles as ('USER' | 'COMPANY' | 'ADMIN')[])
      }
    } catch (error) {
      showErrorToast(error, '회원 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userUuid])

  const handleStatusChange = async () => {
    if (!user) return

    try {
      const data: ChangeUserStatusRequest = {
        status: selectedStatus,
      }
      if (statusReason) data.reason = statusReason

      await changeUserStatus(userUuid, data)
      showSuccessToast('회원 상태가 변경되었습니다.')
      setStatusReason('')
      fetchUser()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다.')
    }
  }

  const handleRolesChange = async () => {
    if (!user) return

    if (selectedRoles.length === 0) {
      showErrorToast('최소 1개 이상의 역할을 선택해주세요.')
      return
    }

    try {
      const data: ChangeUserRolesRequest = {
        roles: selectedRoles,
      }

      await changeUserRoles(userUuid, data)
      showSuccessToast('회원 역할이 변경되었습니다.')
      fetchUser()
    } catch (error) {
      showErrorToast(error, '역할 변경에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (!confirm(`정말로 "${user.name} (${user.email})" 회원을 삭제하시겠습니까?`)) return

    try {
      await deleteAdminUser(userUuid)
      showSuccessToast('회원이 삭제되었습니다.')
      router.push('/admin/users')
    } catch (error) {
      showErrorToast(error, '회원 삭제에 실패했습니다.')
    }
  }

  const toggleRole = (role: 'USER' | 'COMPANY' | 'ADMIN') => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
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

  if (isLoading) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  if (!user) {
    return (
      <AdminGuard>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">회원을 찾을 수 없습니다.</p>
          </div>
        </div>
        <Footer />
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">회원 상세 정보</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              목록으로
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <div className="text-gray-900">{user.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <div className="text-gray-900">{user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <div className="text-gray-900">{user.phoneNumber || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UUID</label>
                <div className="text-sm text-gray-500 font-mono">{user.uuid}</div>
              </div>
            </div>
          </div>

          {/* 상태 관리 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">상태 관리</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 상태</label>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(user.status)}`}>
                  {getStatusLabel(user.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태 변경</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                  <option value="SUSPENDED">정지</option>
                  <option value="PENDING">대기</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">변경 사유 (선택)</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="예: 스팸 활동으로 인한 계정 정지"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleStatusChange}
                disabled={selectedStatus === user.status && !statusReason}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                상태 변경
              </button>
            </div>
          </div>

          {/* 역할 관리 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">역할 관리</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현재 역할</label>
                <div className="flex gap-2">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {role === 'USER' ? '사용자' : role === 'COMPANY' ? '업체' : '관리자'}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">역할 선택</label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes('USER')}
                      onChange={() => toggleRole('USER')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">사용자</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes('COMPANY')}
                      onChange={() => toggleRole('COMPANY')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">업체</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes('ADMIN')}
                      onChange={() => toggleRole('ADMIN')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">관리자</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleRolesChange}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                역할 변경
              </button>
            </div>
          </div>

          {/* 인증 정보 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">인증 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 인증</label>
                <div className="flex items-center">
                  {user.emailVerified ? (
                    <span className="text-green-600">✓ 인증됨</span>
                  ) : (
                    <span className="text-gray-400">미인증</span>
                  )}
                </div>
                {user.emailVerifiedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(user.emailVerifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰 인증</label>
                <div className="flex items-center">
                  {user.phoneVerified ? (
                    <span className="text-green-600">✓ 인증됨</span>
                  ) : (
                    <span className="text-gray-400">미인증</span>
                  )}
                </div>
                {user.phoneVerifiedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(user.phoneVerifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">본인인증</label>
                <div className="flex items-center">
                  {user.identityVerified ? (
                    <span className="text-green-600">✓ 인증됨</span>
                  ) : (
                    <span className="text-gray-400">미인증</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">약관 동의</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이용약관</label>
                <div>{user.termsAgreed ? '✓ 동의' : '미동의'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">개인정보 처리방침</label>
                <div>{user.privacyAgreed ? '✓ 동의' : '미동의'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마케팅 수신</label>
                <div>{user.marketingAgreed ? '✓ 동의' : '미동의'}</div>
              </div>
            </div>
          </div>

          {/* 로그인 정보 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">로그인 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">총 로그인 횟수</label>
                <div className="text-lg font-semibold text-gray-900">{user.loginCount}회</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">로그인 실패 횟수</label>
                <div className="text-lg font-semibold text-gray-900">{user.failedLoginCount}회</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마지막 로그인</label>
                <div className="text-gray-900">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : '없음'}
                </div>
              </div>
            </div>
          </div>

          {/* 기타 정보 */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기타 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로필 완성</label>
                <div>{user.profileCompleted ? '✓ 완료' : '미완료'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                <div className="text-gray-900">
                  {new Date(user.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최종 수정일</label>
                <div className="text-gray-900">
                  {new Date(user.updatedAt).toLocaleString()}
                </div>
              </div>
              {user.isDeleted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">삭제일</label>
                  <div className="text-red-600">
                    {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : '-'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
