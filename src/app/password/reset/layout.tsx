import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '비밀번호 재설정 - 다모아',
  description: '비밀번호를 재설정합니다',
}

export default function PasswordResetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
