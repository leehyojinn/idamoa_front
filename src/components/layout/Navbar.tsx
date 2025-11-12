'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaBars } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import Quickmenu from './Quickmenu'
import DesktopNav from './DesktopNav'
import MobileMenu from './MobileMenu'
import UserMenu from './UserMenu'
import { useScrollPosition } from '@/hooks/useScrollPosition'
import { useAuth } from '@/hooks/useAuth'
import type { NavbarProps } from '@/types/navbar'

const NAV_ITEMS = [
  { id: 'photos', label: '사진', href: '/photos' },
  { id: 'resources', label: '자료실', href: '/resources' },
  { id: 'notices', label: '공지/이벤트', href: '/notices' },
  { id: 'estimates', label: '견적의뢰', href: '/estimates' },
  {
    id: 'ai-manager',
    label: 'AI사무장',
    href: '#',
    children: [
      { id: 'matching', label: '업체 AI 추천', href: '/matching' },
      { id: 'estimate-calculator', label: '예상견적', href: '/estimate-calculator' },
    ]
  },
  { id: 'planner', label: '플래너', href: '/planner' },
  { id: 'consultations', label: '빠른상담', href: '/consultations' },
  { id: 'floorplan-tool', label: '평면도 설계툴', href: '/mock-tools/floorplan-tool' },
  { id: 'review', label: '고객후기', href: '/review' },
]

export default function Navbar({ variant = 'default', showQuickmenu = true }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isScrolled } = useScrollPosition(20)
  const { user, logout } = useAuth()

  const handleLogin = () => {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {showQuickmenu && <Quickmenu />}
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: isScrolled || variant === 'default' ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.8)',
          boxShadow: isScrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        }}
        transition={{ duration: 0.2 }}
        className="sticky top-0 z-40 border-b border-gray-200 backdrop-blur-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                <Image
                  src="/images/bi/bi-logo-wide-blue.svg"
                  alt="MyApp Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* User Menu */}
              <div className="hidden lg:block">
                <UserMenu user={user} onLogin={handleLogin} onLogout={handleLogout} />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="메뉴 열기"
                aria-expanded={isMobileMenuOpen}
              >
                <FaBars className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div>
            <DesktopNav navItems={NAV_ITEMS} />
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={NAV_ITEMS}
      />
    </>
  )
}
