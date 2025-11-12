import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '회원가입',
  description: '다모아에 가입하고 인테리어 서비스를 이용해보세요. 간편한 회원가입으로 모든 기능을 이용하실 수 있습니다.',
  path: '/signup',
  keywords: ['회원가입', '가입', '신규가입'],
  noIndex: true,
})

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
