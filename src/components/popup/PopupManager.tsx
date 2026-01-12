'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import {
  getActivePopups,
  incrementViewCount,
  incrementClickCount,
  type Popup,
  type PopupPosition,
} from '@/lib/api/popup'
import { useIsMobile } from '@/hooks/useMediaQuery'

const STORAGE_KEY = 'popup_hidden_until'

// 팝업 사이즈 계산 (단위 포함)
const getPopupSize = (popup: Popup, isMobile: boolean) => {
  if (isMobile && popup.mobileEnabled) {
    return {
      width: popup.mobileWidth ? `${popup.mobileWidth}${popup.mobileWidthUnit}` : 'auto',
      height: popup.mobileHeight ? `${popup.mobileHeight}${popup.mobileHeightUnit}` : 'auto',
    }
  }
  return {
    width: popup.width ? `${popup.width}${popup.widthUnit}` : '600px',
    height: popup.height ? `${popup.height}${popup.heightUnit}` : 'auto',
  }
}

// 팝업 위치 정보 계산
const getPopupPositionInfo = (popup: Popup, isMobile: boolean) => {
  if (isMobile && popup.mobileEnabled) {
    return {
      position: popup.mobilePosition || 'CENTER',
      offsetX: `${popup.mobileOffsetX || 0}${popup.mobileOffsetXUnit || 'px'}`,
      offsetY: `${popup.mobileOffsetY || 0}${popup.mobileOffsetYUnit || 'px'}`,
    }
  }
  return {
    position: popup.position || 'CENTER',
    offsetX: `${popup.offsetX || 0}${popup.offsetXUnit || 'px'}`,
    offsetY: `${popup.offsetY || 0}${popup.offsetYUnit || 'px'}`,
  }
}

// 위치에 따른 CSS 스타일
const getPositionStyle = (popup: Popup, isMobile: boolean): React.CSSProperties => {
  const positionInfo = getPopupPositionInfo(popup, isMobile)
  const base: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
  }

  switch (positionInfo.position) {
    case 'CENTER':
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${positionInfo.offsetX}, ${positionInfo.offsetY})`,
      }
    case 'TOP_LEFT':
      return {
        ...base,
        top: positionInfo.offsetY,
        left: positionInfo.offsetX,
      }
    case 'TOP_RIGHT':
      return {
        ...base,
        top: positionInfo.offsetY,
        right: positionInfo.offsetX,
      }
    case 'BOTTOM_LEFT':
      return {
        ...base,
        bottom: positionInfo.offsetY,
        left: positionInfo.offsetX,
      }
    case 'BOTTOM_RIGHT':
      return {
        ...base,
        bottom: positionInfo.offsetY,
        right: positionInfo.offsetX,
      }
    case 'CUSTOM':
      return {
        ...base,
        top: positionInfo.offsetY,
        left: positionInfo.offsetX,
      }
    default:
      return {
        ...base,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
  }
}

export default function PopupManager() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const loadPopups = async () => {
      try {
        const response = await getActivePopups()
        if (response.success && response.data.length > 0) {
          const now = new Date().getTime()
          const hiddenData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

          // 필터링: 숨김 설정 확인
          const visibleList = response.data.filter((popup) => {
            const hiddenUntil = hiddenData[popup.uuid]
            if (hiddenUntil && now < hiddenUntil) {
              return false // 아직 숨김 기간
            }
            return true
          })

          if (visibleList.length > 0) {
            // 노출 순서로 정렬 (낮은 순서가 먼저)
            const sortedList = visibleList.sort((a, b) => a.displayOrder - b.displayOrder)

            setPopups(sortedList)
            setIsVisible(true)

            // 조회수 증가
            sortedList.forEach((popup) => {
              incrementViewCount(popup.uuid).catch(console.error)
            })
          }
        }
      } catch (error) {
        console.error('Failed to load popups:', error)
      }
    }

    loadPopups()
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleHideToday = () => {
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0) // 다음날 0시
    const hiddenData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    // 모든 팝업을 오늘 하루 숨김 처리
    popups.forEach((popup) => {
      hiddenData[popup.uuid] = tomorrow.getTime()
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenData))
    handleClose()
  }

  const handleClick = async (popup: Popup) => {
    if (popup.linkUrl) {
      try {
        await incrementClickCount(popup.uuid)
        window.open(popup.linkUrl, '_blank')
      } catch (error) {
        console.error('Failed to increment click count:', error)
      }
    }
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? popups.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === popups.length - 1 ? 0 : prev + 1))
  }

  if (!isVisible || popups.length === 0) {
    return null
  }

  const currentPopup = popups[currentIndex]
  const hasMultiplePopups = popups.length > 1
  const size = getPopupSize(currentPopup, isMobile)

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed z-50"
          style={getPositionStyle(currentPopup, isMobile)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              width: size.width,
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              {/* 팝업 내용 */}
              <div
                className="relative"
                style={{
                  height: size.height,
                  maxHeight: 'calc(100vh - 200px)',
                  overflow: 'auto',
                }}
              >
                {currentPopup.imageUrl ? (
                  <div
                    onClick={() => handleClick(currentPopup)}
                    className={currentPopup.linkUrl ? 'cursor-pointer' : ''}
                  >
                    <Image
                      src={currentPopup.imageUrl}
                      alt={currentPopup.title}
                      width={currentPopup.width || 600}
                      height={currentPopup.height || 400}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">이미지가 없습니다.</div>
                )}

                {/* 좌우 화살표 (여러 개일 때만 표시) */}
                {hasMultiplePopups && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-primary-800/70 transition-colors z-10"
                      aria-label="이전"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-primary-800/70 transition-colors z-10"
                      aria-label="다음"
                    >
                      <FaChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* 제목 페이지네이션 (여러 개일 때만 표시) */}
              {hasMultiplePopups && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-2 overflow-x-auto">
                    {popups.map((popup, index) => (
                      <button
                        key={popup.uuid}
                        onClick={() => setCurrentIndex(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          index === currentIndex
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {popup.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex border-t border-gray-200">
                <button
                  onClick={handleHideToday}
                  className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  오늘 하루 보지 않기
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 text-sm text-gray-900 font-medium hover:bg-gray-50 transition-colors border-l border-gray-200"
                >
                  닫기
                </button>
              </div>

              {/* 우측 상단 닫기 버튼 */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-primary-800/70 transition-colors z-10"
                aria-label="닫기"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
