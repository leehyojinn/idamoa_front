'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from '@/types/navbar'

interface DesktopNavProps {
  navItems: NavItem[]
}

export default function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname()
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)

  return (
    <nav className="hidden lg:flex items-center justify-between space-x-1 py-2" style={{borderTop:'1px solid #f1f1f1'}} role="navigation" aria-label="메인 네비게이션">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.children?.some(child => pathname === child.href))
        const hasChildren = item.children && item.children.length > 0

        return (
          <div
            key={item.id}
            className="relative flex items-center justify-center"
            onMouseEnter={() => hasChildren && setHoveredItemId(item.id)}
            onMouseLeave={() => hasChildren && setHoveredItemId(null)}
          >
            <Link
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-secondary transition-colors rounded-lg hover:bg-gray-50"
            >
              {item.label}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300"
                />
              )}
            </Link>

            {hasChildren && hoveredItemId === item.id && (
              <div className="absolute top-full left-0 right-0 pt-2 z-50 flex justify-center animate-fadeIn">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[140px] whitespace-nowrap">
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`block px-4 py-2 text-sm text-center transition-colors ${
                          isChildActive
                            ? 'text-primary bg-blue-50 font-medium'
                            : 'text-gray-700 hover:text-secondary hover:bg-gray-50'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
