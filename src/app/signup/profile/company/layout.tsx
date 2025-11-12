import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '업체 프로필 설정',
  description: '업체 프로필 정보를 입력해주세요.',
  path: '/signup/profile/company',
  noIndex: true,
})

export default function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
