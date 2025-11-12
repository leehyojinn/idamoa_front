import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '이메일 인증',
  description: '이메일 인증을 완료하고 회원가입을 진행하세요.',
  path: '/signup/verify',
  noIndex: true,
})

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
