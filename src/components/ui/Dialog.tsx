'use client'

import { useDialogStore } from '@/stores/useDialogStore'
import { useEffect } from 'react'

export default function Dialog() {
  const { isOpen, title, message, type, confirmText, cancelText, onConfirm, onCancel, closeDialog } =
    useDialogStore()

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm()
    }
    closeDialog()
  }

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel()
    }
    closeDialog()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={type === 'alert' ? handleConfirm : handleCancel}
      />

      {/* 다이얼로그 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
        {/* 헤더 */}
        {title && (
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        )}

        {/* 메시지 */}
        <div className={`px-6 ${title ? 'pb-6' : 'py-6'}`}>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 pb-6">
          {type === 'confirm' ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-primary/25"
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-primary/25"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
