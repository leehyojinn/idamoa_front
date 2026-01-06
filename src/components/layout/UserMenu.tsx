'use client'

import Link from 'next/link'
import type { User } from '@/types/navbar'

interface UserMenuProps {
  user?: User | null
  onLogin?: () => void
  onLogout?: () => void
}

export default function UserMenu({ user, onLogin, onLogout }: UserMenuProps) {
  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={onLogin}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
          로그인
        </button>
        <Link
          href="/signup"
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
          회원가입
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <Link
        href="/mypage"
        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-secondary/90 transition-colors"
      >
        마이페이지
      </Link>
      <button
        onClick={onLogout}
        className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        로그아웃
      </button>
    </div>
  )
}
