import { Metadata } from 'next'
import { cache } from 'react'
import { getPortfolio } from '@/lib/api/portfolio'
import { ImageGallerySchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

// React cache를 사용하여 같은 요청 내에서 API 호출 중복 제거
const getCachedPortfolio = cache(async (uuid: string) => {
  return getPortfolio(uuid)
})

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ uuid: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  const siteUrl = 'https://i-damoa.com'
  const canonicalUrl = `${siteUrl}/portfolios/${uuid}`

  try {
    const response = await getCachedPortfolio(uuid)
    if (response.success && response.data) {
      const portfolio = response.data
      const thumbnailUrl = portfolio.thumbnailUrl || portfolio.images?.[0]?.fileUrl || '/images/seo-image-v003.png'

      return {
        title: `${portfolio.title} | 인테리어 다모아`,
        description: portfolio.description || `${portfolio.title} - 인테리어 포트폴리오`,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: portfolio.title,
          description: portfolio.description || `${portfolio.title} - 인테리어 포트폴리오`,
          url: canonicalUrl,
          type: 'article',
          images: [
            {
              url: thumbnailUrl,
              width: 1200,
              height: 630,
              alt: portfolio.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: portfolio.title,
          description: portfolio.description || `${portfolio.title} - 인테리어 포트폴리오`,
          images: [thumbnailUrl],
        },
      }
    }
  } catch (error) {
    console.error('포트폴리오 메타데이터 로드 실패:', error)
  }

  return {
    title: '포트폴리오 | 인테리어 다모아',
    description: '인테리어 포트폴리오 상세 페이지',
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function PortfolioDetailLayout({ children, params }: LayoutProps) {
  const { uuid } = await params
  const siteUrl = 'https://i-damoa.com'
  const portfolioUrl = `${siteUrl}/portfolios/${uuid}`

  let portfolio = null
  try {
    const response = await getCachedPortfolio(uuid)
    if (response.success && response.data) {
      portfolio = response.data
    }
  } catch (error) {
    console.error('포트폴리오 로드 실패:', error)
  }

  return (
    <>
      {portfolio && portfolio.images && portfolio.images.length > 0 && (
        <>
          <ImageGallerySchema
            name={portfolio.title}
            description={portfolio.description}
            url={portfolioUrl}
            images={portfolio.images.map((img: { fileUrl: string; thumbnailUrl?: string }) => ({
              url: img.fileUrl,
            }))}
            author={portfolio.company?.companyName || '인테리어 다모아'}
            datePublished={portfolio.createdAt}
          />
          <BreadcrumbSchema
            items={[
              { name: '홈', url: siteUrl },
              { name: '포트폴리오', url: `${siteUrl}/?tab=portfolio` },
              { name: portfolio.title, url: portfolioUrl },
            ]}
          />
        </>
      )}
      {children}
    </>
  )
}
