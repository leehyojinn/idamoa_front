'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import {
  getAdminPromotionSettings,
  createAdminPromotionSetting,
  updateAdminPromotionSetting,
  deleteAdminPromotionSetting,
  type PromotionTypeSetting,
} from '@/lib/api/gallery-promotion'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

export default function AdminPromotionSettingsPage() {
  const [settings, setSettings] = useState<PromotionTypeSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PromotionTypeSetting>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newSetting, setNewSetting] = useState({
    promotionType: '',
    displayName: '',
    price: 0,
    weight: 1,
    displayOrder: 0,
    description: '',
  })

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await getAdminPromotionSettings()
      if (response.success && response.data) {
        setSettings(response.data)
      }
    } catch (error) {
      showErrorToast(error, '우대 타입 설정을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleCreate = async () => {
    if (!newSetting.promotionType || !newSetting.displayName) {
      showErrorToast(null, '타입 코드와 표시명은 필수입니다')
      return
    }

    try {
      setIsSubmitting(true)
      await createAdminPromotionSetting(newSetting)
      showSuccessToast('우대 타입이 생성되었습니다')
      setShowCreateModal(false)
      setNewSetting({
        promotionType: '',
        displayName: '',
        price: 0,
        weight: 1,
        displayOrder: 0,
        description: '',
      })
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '우대 타입 생성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (setting: PromotionTypeSetting) => {
    setEditingId(setting.uuid)
    setEditForm({
      displayName: setting.displayName,
      price: setting.price,
      weight: setting.weight,
      displayOrder: setting.displayOrder,
      description: setting.description,
      isActive: setting.isActive,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async (uuid: string) => {
    try {
      setIsSubmitting(true)
      await updateAdminPromotionSetting(uuid, editForm)
      showSuccessToast('우대 타입이 수정되었습니다')
      setEditingId(null)
      setEditForm({})
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '우대 타입 수정에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('이 우대 타입을 비활성화하시겠습니까?\n(기존 우대는 유지되며, 신규 등록만 불가합니다)')) {
      return
    }

    try {
      await deleteAdminPromotionSetting(uuid)
      showSuccessToast('우대 타입이 비활성화되었습니다')
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '우대 타입 비활성화에 실패했습니다')
    }
  }

  const handleToggleActive = async (setting: PromotionTypeSetting) => {
    try {
      await updateAdminPromotionSetting(setting.uuid, { isActive: !setting.isActive })
      showSuccessToast(setting.isActive ? '비활성화되었습니다' : '활성화되었습니다')
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/gallery-promotions"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">우대 타입 설정</h1>
              <p className="text-gray-600 mt-1">우대등록 타입별 가격, 가중치를 관리합니다</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-800 text-white rounded-lg font-medium transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            새 타입 추가
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">타입 코드</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">표시명</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">가격 (원/월)</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">가중치</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">순서</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">설명</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">상태</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settings.map((setting) => {
                    const isEditing = editingId === setting.uuid

                    return (
                      <tr key={setting.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {setting.promotionType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.displayName || ''}
                              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{setting.displayName}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.price || 0}
                              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            />
                          ) : (
                            <span className="font-medium">{setting.price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editForm.weight || 1}
                              onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            />
                          ) : (
                            <span className="font-bold text-primary">{setting.weight}x</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editForm.displayOrder || 0}
                              onChange={(e) => setEditForm({ ...editForm, displayOrder: Number(e.target.value) })}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            />
                          ) : (
                            <span>{setting.displayOrder}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-gray-600 text-sm">{setting.description}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleActive(setting)}
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              setting.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {setting.isActive ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(setting.uuid)}
                                disabled={isSubmitting}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStartEdit(setting)}
                                className="p-2 bg-primary-100 text-primary rounded-lg hover:bg-primary-200 transition-colors"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(setting.uuid)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {settings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">등록된 우대 타입이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">가중치 안내</h3>
          <p className="text-sm text-yellow-700">
            가중치는 우대 갤러리가 메인 페이지에 노출될 확률을 결정합니다.
            예를 들어, 가중치 1인 STANDARD와 가중치 3인 PREMIUM이 있으면,
            PREMIUM이 선택될 확률은 75% (3/4)입니다.
          </p>
        </div>
      </div>

      {/* 새 타입 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">새 우대 타입 생성</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  타입 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSetting.promotionType}
                  onChange={(e) =>
                    setNewSetting({
                      ...newSetting,
                      promotionType: e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''),
                    })
                  }
                  placeholder="SUPER_PREMIUM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">대문자와 언더스코어만 사용 가능</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  표시명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSetting.displayName}
                  onChange={(e) => setNewSetting({ ...newSetting, displayName: e.target.value })}
                  placeholder="슈퍼우대"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가격 (원/월)
                  </label>
                  <input
                    type="number"
                    value={newSetting.price}
                    onChange={(e) => setNewSetting({ ...newSetting, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가중치
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newSetting.weight}
                    onChange={(e) => setNewSetting({ ...newSetting, weight: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  표시 순서
                </label>
                <input
                  type="number"
                  min="0"
                  value={newSetting.displayOrder}
                  onChange={(e) => setNewSetting({ ...newSetting, displayOrder: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  placeholder="5배 노출 확률"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </AdminGuard>
  )
}
