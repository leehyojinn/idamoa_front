'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IoHeart, IoHeartOutline } from 'react-icons/io5'
import { toggleCompanyLike } from '@/lib/api/company'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'

interface CompanyLikeButtonProps {
  companyUuid: string
  initialIsLiked: boolean
  initialLikeCount: number
}

export default function CompanyLikeButton({
  companyUuid,
  initialIsLiked,
  initialLikeCount,
}: CompanyLikeButtonProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLikeClick = async () => {
    // 로그인 체크
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        showErrorToast(null, '로그인이 필요합니다')
        router.push('/login')
        return
      }
    }

    setIsLoading(true)

    try {
      const result = await toggleCompanyLike(companyUuid)

      if (result.success) {
        setIsLiked(result.data.isLiked)
        setLikeCount(result.data.isLiked ? likeCount + 1 : likeCount - 1)
        showSuccessToast(result.data.message)
      }
    } catch (error) {
      showErrorToast(error, '좋아요 처리 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLikeClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLiked ? (
        <IoHeart className="text-red-500 text-xl" />
      ) : (
        <IoHeartOutline className="text-gray-400 text-xl" />
      )}
      <span className="text-sm font-medium text-gray-700">
        {isLiked ? '좋아요' : '좋아요'} {likeCount.toLocaleString()}
      </span>
    </button>
  )
}
