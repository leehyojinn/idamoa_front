import { Metadata } from 'next'

// 기본 메타데이터 설정
const siteUrl = 'https://i-damoa.com'
const siteName = '인테리어 다모아'
const siteDescription = '인테리어 업체 비교, 무료 견적, 시공 사례까지! 아파트·주택·상가 인테리어 전문 업체를 한눈에 비교하고 내 집에 딱 맞는 인테리어를 찾아보세요. 전국 인테리어 업체 포트폴리오와 실시간 견적을 다모아에서 확인하세요.'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  title: {
    default: `${siteName} | 인테리어의 모든 것`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    '인테리어',
    '인테리어 업체',
    '인테리어 견적',
    '인테리어 비용',
    '인테리어 업체 추천',
    '인테리어 비교',
    '리모델링',
    '리모델링 업체',
    '리모델링 비용',
    '집 인테리어',
    '집꾸미기',
    '아파트 인테리어',
    '아파트 인테리어 비용',
    '신혼집 인테리어',
    '주택 인테리어',
    '빌라 인테리어',
    '오피스텔 인테리어',
    '상가 인테리어',
    '사무실 인테리어',
    '병원 인테리어',
    '인테리어 포트폴리오',
    '인테리어 시공',
    '인테리어 시공 사례',
    '인테리어 디자인',
    '인테리어 견적 비교',
    '무료 인테리어 견적',
    '인테리어 다모아',
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
        url: '/images/seo-image-v003.png',
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
    images: ['/images/seo-image-v003.png'],
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
  image = '/images/seo-image-v003.png',
}: PageMetadataOptions): Metadata {
  const url = `${siteUrl}${path}`
  // 쿼리 파라미터 제거하여 canonical URL 생성
  const canonicalPath = path.split('?')[0]
  const canonicalUrl = `${siteUrl}${canonicalPath}`

  return {
    title,
    description,
    keywords: [...defaultMetadata.keywords as string[], ...keywords],
    alternates: {
      canonical: canonicalUrl,
    },
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
