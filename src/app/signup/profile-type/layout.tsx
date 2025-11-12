import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '프로필 타입 선택',
  description: '일반 사용자 또는 업체 회원으로 프로필을 설정하세요.',
  path: '/signup/profile-type',
  noIndex: true,
})

export default function ProfileTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
