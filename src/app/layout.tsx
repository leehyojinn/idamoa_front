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
  title: '다모아 | 인테리어의 모든 것',
  description: '병원, 의원, 치과, 한의원 등 의료기관 인테리어 전문 업체들을 한곳에서 확인하세요.',
  keywords: [
    '병원인테리어',
    '의원인테리어',
    '치과인테리어',
    '한의원인테리어',
    '의료기관인테리어',
    '병원리모델링',
    '의료시설인테리어',
    '인테리어',
    '리모델링',
  ],
  verification: {
    google: 'TJWb6qHYNW4dlSJfSbe0_yIFROOQL6F-yznCNiHAONE',
    other: {
      'naver-site-verification': 'af76a3049ba372f72bd2fadff2bfb3d128f0c3ae',
    },
  },
  openGraph: {
    ...defaultMetadata.openGraph,
    title: '다모아 | 인테리어의 모든 것',
    description: '병원, 의원, 치과, 한의원 등 의료기관 인테리어 전문 업체들을 한곳에서 확인하세요.',
    images: ['/images/seo-image-v001.png'],
  },
  twitter: {
    ...defaultMetadata.twitter,
    title: '다모아 | 인테리어의 모든 것',
    description: '병원, 의원, 치과, 한의원 등 의료기관 인테리어 전문 업체들을 한곳에서 확인하세요.',
    images: ['/images/seo-image-v001.png'],
  },
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
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-0GWCFDQ9SE" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0GWCFDQ9SE');
          `}
        </Script>
        {/* Daum Postcode (Kakao Address) */}
        <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
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
