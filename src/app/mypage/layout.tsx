import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '마이페이지',
  description: '회원 정보 관리 및 업체 정보 관리',
  path: '/mypage',
  noIndex: true, // 개인 페이지는 검색엔진에서 제외
})

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
