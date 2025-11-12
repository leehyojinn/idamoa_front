'use client'

import { useState, useEffect } from 'react'

interface ScrollPosition {
  scrollY: number
  isScrolled: boolean
  isScrollingDown: boolean
}

export function useScrollPosition(threshold: number = 10): ScrollPosition {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollY: 0,
    isScrolled: false,
    isScrollingDown: false,
  })

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      setScrollPosition({
        scrollY: currentScrollY,
        isScrolled: currentScrollY > threshold,
        isScrollingDown: currentScrollY > lastScrollY && currentScrollY > threshold,
      })

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return scrollPosition
}
