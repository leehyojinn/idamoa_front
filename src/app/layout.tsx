import './globals.css'
import QueryProvider from '@/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import { defaultMetadata } from '@/lib/metadata'
import GlobalDialog from '@/components/ui/Dialog'
import PasswordResetModal from '@/components/ui/PasswordResetModal'
import ProfileGuard from '@/components/auth/ProfileGuard'
import FloatingConsultationButton from '@/components/consultation/FloatingConsultationButton'
import localFont from 'next/font/local'
import type { Metadata } from 'next'

const pretendard = localFont({
  src: [
    {
      path: '../../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="PaYTWF4RwmZynBzMccFHSJX07TmPlb0UdZk9sZFgBLs" />
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-RTCZFSJL0W" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RTCZFSJL0W');
          `}
        </Script>
        {/* Daum Postcode (Kakao Address) */}
        <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
        {/* Toss Payments SDK */}
        <Script src="https://js.tosspayments.com/v1/payment" strategy="lazyOnload" />
      </head>
      <body className={`${pretendard.variable} antialiased`} style={{ fontFamily: 'var(--font-pretendard)' }}>
        <QueryProvider>
          <ProfileGuard />
          {children}
        </QueryProvider>
        <Toaster position="top-right" />
        <GlobalDialog />
        <PasswordResetModal />
        <FloatingConsultationButton />
      </body>
    </html>
  )
}
