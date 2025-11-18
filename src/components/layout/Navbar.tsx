'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { FaBars } from 'react-icons/fa'
import Quickmenu from './Quickmenu'
import DesktopNav from './DesktopNav'
import { useScrollPosition } from '@/hooks/useScrollPosition'
import { useAuth } from '@/hooks/useAuth'
import { useDialog } from '@/hooks/useDialog'
import type { NavbarProps } from '@/types/navbar'

const UserMenu = dynamic(() => import('./UserMenu'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center px-4 py-2">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  ),
})

const MobileMenu = dynamic(() => import('./MobileMenu'), {
  ssr: false,
})

const NAV_ITEMS = [
  { id: 'photos', label: '사진', href: '/photos' },
  { id: 'resources', label: '자료실', href: '/resources' },
  { id: 'estimates', label: '견적의뢰', href: '/estimates' },
  {
    id: 'ai-manager',
    label: 'AI사무장',
    href: '/matching',
    children: [
      { id: 'matching', label: '업체 AI 추천', href: '/matching' },
      { id: 'estimate-calculator', label: '예상견적', href: '/estimate-calculator' },
    ]
  },
  {
    id: 'consultation-request',
    label: '상담신청',
    href: '/consultations',
    children: [
      { id: 'consultations', label: '빠른상담', href: '/consultations' },
      { id: 'planner', label: '플래너', href: '/planner' },
    ]
  },
  { id: 'floorplan-tool', label: '평면도 설계툴', href: '/mock-tools/floorplan-tool' },
  { id: 'notices', label: '공지/이벤트', href: '/notices' },  
  { id: 'review', label: '고객후기', href: '/review' },
]

export default function Navbar({ variant = 'default', showQuickmenu = true }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isScrolled } = useScrollPosition(20)
  const { user, logout } = useAuth()
  const { confirm } = useDialog()

  const handleLogin = () => {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const handleLogout = () => {
    confirm('로그아웃 하시겠습니까?', {
      title: '로그아웃',
      confirmText: '로그아웃',
      cancelText: '취소',
      onConfirm: async () => {
        await logout()
      },
    })
  }

  return (
    <>
      {showQuickmenu && <Quickmenu />}
      <nav
        className={`sticky top-0 z-40 border-b border-gray-200 backdrop-blur-sm transition-all duration-200 ${
          isScrolled || variant === 'default'
            ? 'bg-white shadow-sm'
            : 'bg-white/80 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]'
        }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                <Image
                  src="/images/bi/bi-logo-wide-blue.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                  style={{width:'150px'}}
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
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={NAV_ITEMS}
      />
    </>
  )
}
