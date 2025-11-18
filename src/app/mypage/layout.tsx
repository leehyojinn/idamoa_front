import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '마이페이지 - 다모아',
  description: '회원 정보 관리 및 업체 정보 관리',
}

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
