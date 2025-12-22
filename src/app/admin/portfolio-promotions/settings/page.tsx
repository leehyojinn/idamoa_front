'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminGuard from '@/components/auth/AdminGuard'
import {
  adminGetPromotionSettings,
  adminCreatePromotionSetting,
  adminUpdatePromotionSetting,
  adminDeactivatePromotionSetting,
  type PromotionTypeSetting,
} from '@/lib/api/portfolio'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

export default function AdminPromotionSettingsPage() {
  const [settings, setSettings] = useState<PromotionTypeSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSetting, setEditingSetting] = useState<PromotionTypeSetting | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
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
      const response = await adminGetPromotionSettings()
      if (response.success && response.data) {
        setSettings(response.data.sort((a, b) => a.displayOrder - b.displayOrder))
      }
    } catch (error) {
      showErrorToast(error, '프로모션 설정을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleCreate = () => {
    setEditingSetting(null)
    setFormData({
      promotionType: '',
      displayName: '',
      price: 0,
      weight: 1,
      displayOrder: settings.length,
      description: '',
    })
    setShowModal(true)
  }

  const handleEdit = (setting: PromotionTypeSetting) => {
    setEditingSetting(setting)
    setFormData({
      promotionType: setting.promotionType,
      displayName: setting.displayName,
      price: setting.price,
      weight: setting.weight,
      displayOrder: setting.displayOrder,
      description: setting.description || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingSetting) {
        await adminUpdatePromotionSetting(editingSetting.uuid, {
          displayName: formData.displayName,
          price: formData.price,
          weight: formData.weight,
          displayOrder: formData.displayOrder,
          description: formData.description,
        })
        showSuccessToast('프로모션 설정이 수정되었습니다')
      } else {
        await adminCreatePromotionSetting({
          promotionType: formData.promotionType,
          displayName: formData.displayName,
          price: formData.price,
          weight: formData.weight,
          displayOrder: formData.displayOrder,
          description: formData.description,
        })
        showSuccessToast('프로모션 설정이 생성되었습니다')
      }
      setShowModal(false)
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '저장에 실패했습니다')
    }
  }

  const handleDeactivate = async (setting: PromotionTypeSetting) => {
    if (!confirm(`정말로 "${setting.displayName}" 설정을 비활성화하시겠습니까?`)) return

    try {
      await adminDeactivatePromotionSetting(setting.uuid)
      showSuccessToast('프로모션 설정이 비활성화되었습니다')
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '비활성화에 실패했습니다')
    }
  }

  const handleToggleActive = async (setting: PromotionTypeSetting) => {
    try {
      await adminUpdatePromotionSetting(setting.uuid, {
        isActive: !setting.isActive,
      })
      showSuccessToast(`프로모션 설정이 ${setting.isActive ? '비활성화' : '활성화'}되었습니다`)
      fetchSettings()
    } catch (error) {
      showErrorToast(error, '상태 변경에 실패했습니다')
    }
  }

  return (
    <AdminGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[calc(100vh-64px-200px)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/portfolio-promotions"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">우대 타입 설정</h1>
              <p className="text-gray-600 mt-1">포트폴리오 우대등록 타입 및 가격 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              새 타입 추가
            </button>
            <button
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">⚙️</div>
            <p className="text-gray-500 text-lg mb-4">등록된 프로모션 설정이 없습니다</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              첫 프로모션 타입 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.uuid}
                className={`bg-white rounded-xl border p-6 ${
                  setting.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      setting.promotionType === 'PREMIUM'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {setting.weight}x
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {setting.displayName}
                        {!setting.isActive && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            비활성
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{setting.promotionType}</p>
                      {setting.description && (
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {setting.price.toLocaleString()}원
                      </p>
                      <p className="text-sm text-gray-500">월</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(setting)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          setting.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {setting.isActive ? '활성' : '비활성'}
                      </button>
                      <button
                        onClick={() => handleEdit(setting)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(setting)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingSetting ? '프로모션 설정 수정' : '새 프로모션 타입 추가'}
            </h3>
            <div className="space-y-4">
              {!editingSetting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입 코드 *
                  </label>
                  <input
                    type="text"
                    value={formData.promotionType}
                    onChange={(e) => setFormData({ ...formData, promotionType: e.target.value.toUpperCase() })}
                    placeholder="예: PREMIUM, STANDARD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  표시 이름 *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="예: 강력우대, 일반우대"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    월 가격 (원) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가중치 *
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  표시 순서
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="이 프로모션 타입에 대한 설명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingSetting ? '수정' : '추가'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </AdminGuard>
  )
}
