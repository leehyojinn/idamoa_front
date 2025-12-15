import { Metadata } from 'next'

// 기본 메타데이터 설정
const siteUrl = 'https://i-damoa.com'
const siteName = '인테리어 다모아'
const siteDescription = '인테리어 전문 업체를 한눈에! 업체 비교, 견적 요청, 포트폴리오 확인까지 인테리어의 모든 것을 다모아에서 만나보세요.'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | 인테리어의 모든 것`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    '인테리어',
    '인테리어 업체',
    '인테리어 견적',
    '인테리어 비교',
    '리모델링',
    '집꾸미기',
    '아파트 인테리어',
    '주거 인테리어',
    '상업 인테리어',
    '사무실 인테리어',
    '인테리어 포트폴리오',
    '인테리어 시공',
    '인테리어 디자인',
    '다모아',
  ],
  authors: [{ name: siteName, url: siteUrl }],
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
    title: `${siteName} | 인테리어의 모든 것`,
    description: siteDescription,
    siteName: siteName,
    images: [
      {
        url: '/images/seo-image-v001.png',
        width: 1200,
        height: 630,
        alt: '인테리어 다모아 - 인테리어 전문 업체 비교 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | 인테리어의 모든 것`,
    description: siteDescription,
    images: ['/images/seo-image-v001.png'],
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
    google: 'TJWb6qHYNW4dlSJfSbe0_yIFROOQL6F-yznCNiHAONE',
    other: {
      'naver-site-verification': 'af76a3049ba372f72bd2fadff2bfb3d128f0c3ae',
    },
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
  image = '/images/seo-image-v001.png',
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
