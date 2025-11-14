'use client'

import { IoChevronBack, IoChevronForward } from 'react-icons/io5'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisible?: number
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}: PaginationProps) {
  if (totalPages === 0) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const halfVisible = Math.floor(maxVisible / 2)

    let startPage = Math.max(0, currentPage - halfVisible)
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible)

    // 시작 부분 조정
    if (currentPage - halfVisible < 0) {
      endPage = Math.min(totalPages - 1, endPage + (halfVisible - currentPage))
    }

    // 끝 부분 조정
    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(0, startPage - (currentPage + halfVisible - totalPages + 1))
    }

    // 첫 페이지
    if (startPage > 0) {
      pages.push(0)
      if (startPage > 1) {
        pages.push('...')
      }
    }

    // 중간 페이지들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // 마지막 페이지
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pages.push('...')
      }
      pages.push(totalPages - 1)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 my-8">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="이전 페이지"
      >
        <IoChevronBack className="text-gray-600" />
      </button>

      {/* 페이지 번호들 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-400"
              >
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-lg border font-medium transition-all
                ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-md scale-110'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              aria-label={`${pageNum + 1}페이지`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum + 1}
            </button>
          )
        })}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="다음 페이지"
      >
        <IoChevronForward className="text-gray-600" />
      </button>
    </div>
  )
}
