import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '로그인 처리 중',
  description: '소셜 로그인 처리 중입니다.',
  path: '/oauth/callback',
  noIndex: true,
})

export default function OAuthCallbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
