import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '사용자 프로필 설정',
  description: '일반 사용자 프로필 정보를 입력해주세요.',
  path: '/signup/profile/user',
  noIndex: true,
})

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
