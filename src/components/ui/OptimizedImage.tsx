'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

// 기본 blur placeholder (회색 그라데이션)
const DEFAULT_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlMmUyZTIiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjY2NjY2MiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg=='

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  showShimmer?: boolean
  fallbackSrc?: string
}

export default function OptimizedImage({
  src,
  alt,
  className,
  showShimmer = true,
  fallbackSrc = '/images/img-placeholder.png',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const imageSrc = hasError ? fallbackSrc : src

  return (
    <>
      {/* Shimmer 로딩 효과 */}
      {showShimmer && isLoading && (
        <div
          className="absolute inset-0 z-10 animate-shimmer"
          style={{
            backgroundImage: 'linear-gradient(90deg, #e5e5e5 0%, #f5f5f5 50%, #e5e5e5 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          className,
          isLoading ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-300'
        )}
        placeholder="blur"
        blurDataURL={DEFAULT_BLUR_DATA_URL}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  )
}
