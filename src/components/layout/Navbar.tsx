'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { FaBars, FaTimes } from 'react-icons/fa'
import { FiSettings } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import Quickmenu from './Quickmenu'
import DesktopNav from './DesktopNav'
import AccountStatusGuard from '@/components/auth/AccountStatusGuard'
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

const NotificationDropdown = dynamic(() => import('@/components/notification/NotificationDropdown'), {
  ssr: false,
  loading: () => (
    <div className="p-2">
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-400"></div>
    </div>
  ),
})

const NAV_ITEMS = [
  { id: 'photos', label: '사진', href: '/photos' },
  { id: 'resources', label: '자료실', href: '/resources' },
  { id: 'estimates', label: '견적의뢰', href: '/estimates' },
  { id: 'estimate-calculator', label: '예상견적', href: '/estimate-calculator' },
  // {
  //   id: 'ai-manager',
  //   label: 'AI사무장',
  //   href: '/matching',
  //   children: [
  //     { id: 'matching', label: '업체 AI 추천', href: '/matching' },
  //     { id: 'estimate-calculator', label: '예상견적', href: '/estimate-calculator' },
  //   ]
  // },
  {
    id: 'consultation-request',
    label: '상담신청',
    href: '/consultations',
    children: [
      { id: 'consultations', label: '빠른상담', href: '/consultations' },
      { id: 'planner', label: '플래너', href: '/planner' },
    ]
  },
  // { id: 'floorplan-tool', label: '평면도 설계툴', href: '/mock-tools/floorplan-tool' },
  { id: 'notices', label: '공지/이벤트', href: '/notices' },
  { id: 'inquiry', label: '일반문의', href: '/inquiries' },
]

const ADMIN_PAGES = [
  { id: 'admin-dashboard', label: '대시보드', href: '/admin' },
  { id: 'admin-analytics', label: 'Analytics 대시보드', href: '/admin/analytics' },
  { id: 'admin-users', label: '회원 관리', href: '/admin/users' },
  { id: 'admin-companies', label: '업체 관리', href: '/admin/companies' },
  { id: 'admin-estimates', label: '견적 관리', href: '/admin/estimates' },
  { id: 'admin-consultations', label: '빠른상담 관리', href: '/admin/consultations' },
  { id: 'admin-planner', label: '플래너 신청서', href: '/admin/planner-applications' },
  { id: 'admin-documents', label: '자료실 관리', href: '/admin/documents' },
  { id: 'admin-galleries', label: '사진 관리', href: '/admin/galleries' },
  { id: 'admin-notice-events', label: '공지/이벤트 관리', href: '/admin/notice-events' },
  { id: 'admin-popups', label: '팝업 관리', href: '/admin/popups' },
  { id: 'admin-filters', label: '필터 관리', href: '/admin/filters' },
  { id: 'admin-general-inquiries', label: '일반 문의', href: '/admin/general-inquiries' },
  { id: 'admin-inquiries', label: '제휴/광고 문의', href: '/admin/inquiries' },
]

export default function Navbar({ variant = 'default', showQuickmenu = true }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
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
      <AccountStatusGuard />
      {showQuickmenu && <Quickmenu />}

      {/* Admin Settings Icon - Fixed Position */}
      {user?.currentRole === 'ADMIN' && (
        <button
          onClick={() => setIsAdminMenuOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="관리자 메뉴"
        >
          <FiSettings className="w-5 h-5" />
        </button>
      )}

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
              {/* Notification - Desktop */}
              {user && (
                <div className="hidden lg:block">
                  <NotificationDropdown />
                </div>
              )}

              {/* User Menu */}
              <div className="hidden lg:block">
                <UserMenu user={user} onLogin={handleLogin} onLogout={handleLogout} />
              </div>

              {/* Notification - Mobile */}
              {user && (
                <div className="lg:hidden">
                  <NotificationDropdown />
                </div>
              )}

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

      {/* Admin Menu Sidebar */}
      <AnimatePresence>
        {isAdminMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsAdminMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl z-50"
              role="dialog"
              aria-label="관리자 메뉴"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600">
                  <h2 className="text-lg font-semibold text-white">관리자 메뉴</h2>
                  <button
                    onClick={() => setIsAdminMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="메뉴 닫기"
                  >
                    <FaTimes className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-4">
                  <ul className="space-y-1 px-2">
                    {ADMIN_PAGES.map((page, index) => (
                      <motion.li
                        key={page.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={page.href}
                          onClick={() => setIsAdminMenuOpen(false)}
                          className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                        >
                          {page.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
