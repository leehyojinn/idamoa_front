import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '로그인',
  description: '다모아에 로그인하고 인테리어 서비스를 이용해보세요.',
  path: '/login',
  keywords: ['로그인', '로그인페이지', '회원'],
  noIndex: true,
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
