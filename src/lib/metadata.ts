import { Metadata } from 'next'

// 기본 메타데이터 설정
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const siteName = '다모아'
const siteDescription = '인테리어의 모든 것을 한 곳에서 - 사진, 업체 찾기, 견적 비교, AI 추천까지'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    '인테리어',
    '리모델링',
    '집꾸미기',
    '인테리어 업체',
    '인테리어 견적',
    '인테리어 AI',
    '평면도',
    '플래너',
    '인테리어 사진',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    title: siteName,
    description: siteDescription,
    siteName: siteName,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '', // Google Search Console 인증 코드
    // yandex: '',
    // other: {},
  },
}

// 페이지별 메타데이터 생성 헬퍼
interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
  image?: string
}

export function createPageMetadata({
  title,
  description,
  path = '',
  keywords = [],
  noIndex = false,
  image = '/images/og-image.jpg',
}: PageMetadataOptions): Metadata {
  const url = `${siteUrl}${path}`

  return {
    title,
    description,
    keywords: [...defaultMetadata.keywords as string[], ...keywords],
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url,
      title: `${title} | ${siteName}`,
      description,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteName}`,
      description,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  }
}
