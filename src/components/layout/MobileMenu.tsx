'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FaTimes, FaChevronDown } from 'react-icons/fa'
import type { NavItem } from '@/types/navbar'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
}

export default function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const toggleExpanded = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl z-50 lg:hidden"
            role="dialog"
            aria-label="모바일 메뉴"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">메뉴</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <FaTimes className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                  {navItems.map((item, index) => {
                    const hasChildren = item.children && item.children.length > 0
                    const isExpanded = expandedItemId === item.id

                    return (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {hasChildren ? (
                          <div>
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-secondary transition-colors font-medium"
                            >
                              <span>{item.label}</span>
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <FaChevronDown className="w-3 h-3" />
                              </motion.div>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.ul
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden pl-4 mt-1 space-y-1"
                                >
                                  {item.children?.map((child) => (
                                    <li key={child.id}>
                                      <Link
                                        href={child.href}
                                        onClick={onClose}
                                        className="block px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-secondary transition-colors"
                                      >
                                        {child.label}
                                      </Link>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-secondary transition-colors font-medium"
                          >
                            {item.label}
                          </Link>
                        )}
                      </motion.li>
                    )
                  })}
                </ul>
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t space-y-2">
                <button className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  로그인
                </button>
                <button className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                  회원가입
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
