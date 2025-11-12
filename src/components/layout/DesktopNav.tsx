'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
            className="relative"
            onMouseEnter={() => hasChildren && setHoveredItemId(item.id)}
            onMouseLeave={() => hasChildren && setHoveredItemId(null)}
          >
            <Link
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-secondary transition-colors rounded-lg hover:bg-gray-50"
            >
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </Link>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {hasChildren && hoveredItemId === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: -10, left: '50%', x: '-50%' }}
                  animate={{ opacity: 1, y: 0, left: '50%', x: '-50%' }}
                  exit={{ opacity: 0, y: -10, left: '50%', x: '-50%' }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 w-fit min-w-[120px] text-center"
                >
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isChildActive
                            ? 'text-primary bg-blue-50 font-medium'
                            : 'text-gray-700 hover:text-secondary hover:bg-gray-50'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )
}
