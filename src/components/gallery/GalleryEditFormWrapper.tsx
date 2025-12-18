'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getGallery, type Gallery } from '@/lib/api/gallery'
import { showErrorToast } from '@/lib/errorHandler'
import GalleryEditForm from './GalleryEditForm'

interface GalleryEditFormWrapperProps {
  uuid: string
}

export default function GalleryEditFormWrapper({ uuid }: GalleryEditFormWrapperProps) {
  const router = useRouter()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const result = await getGallery(uuid)
        if (result.success && result.data) {
          setGallery(result.data)
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          showErrorToast(error, '포트폴리오를 찾을 수 없습니다')
          router.push('/photos')
        } else if (error?.response?.status === 403) {
          showErrorToast(error, '수정 권한이 없습니다')
          router.push(`/photos/${uuid}`)
        } else {
          showErrorToast(error, '포트폴리오를 불러오는데 실패했습니다')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchGallery()
  }, [uuid, router])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">포트폴리오를 불러오는 중...</p>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">포트폴리오를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return <GalleryEditForm gallery={gallery} />
}
