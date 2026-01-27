'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiX, FiImage, FiArrowRight, FiCheckCircle } from 'react-icons/fi'

interface CompanyOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CompanyOnboardingModal({ isOpen, onClose }: CompanyOnboardingModalProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // 약간의 딜레이 후 애니메이션 시작
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleCreatePortfolio = () => {
    onClose()
    router.push('/portfolios/create')
  }

  const handleLater = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleLater}
      />

      {/* 모달 컨텐츠 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleLater}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* 상단 그래픽 영역 */}
        <div className="bg-gradient-to-br from-primary via-primary-600 to-indigo-600 px-6 pt-8 pb-12 text-center relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4">
              <FiImage className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              환영합니다! 🎉
            </h2>
            <p className="text-white/80 text-sm">
              업체 프로필이 생성되었습니다
            </p>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl relative">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              첫 포트폴리오를 등록해보세요
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              포트폴리오를 등록하면 고객들이 회사의 시공 사례를<br />
              확인하고 견적을 요청할 수 있어요
            </p>
          </div>

          {/* 혜택 리스트 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">검색 결과 상단에 노출</span>
            </div>
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">고객에게 시공 사례 어필</span>
            </div>
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">견적 요청 수 증가</span>
            </div>
          </div>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                <FiCheckCircle className="w-4 h-4" />
              </div>
              <span className="text-xs text-green-600 font-medium">상세정보</span>
            </div>
            <div className="w-8 h-px bg-green-400"></div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-xs text-primary font-medium">포트폴리오</span>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="space-y-3">
            <button
              onClick={handleCreatePortfolio}
              className="w-full py-3.5 bg-primary hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              포트폴리오 등록하기
              <FiArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLater}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm"
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
