'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import type { NavItem } from '@/types/navbar'

interface DesktopNavProps {
  navItems: NavItem[]
}

export default function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center justify-between space-x-1 pb-2" role="navigation" aria-label="메인 네비게이션">
      {navItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <Link
            key={item.id}
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
        )
      })}
    </nav>
  )
}
