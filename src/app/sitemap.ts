import { MetadataRoute } from 'next'
import { getCompanies } from '@/lib/api/company'
import { getEstimateRequests } from '@/lib/api/estimate'
import { searchDocuments } from '@/lib/api/resource'
import { searchNoticeEvents } from '@/lib/api/notice-event'
import { searchPortfolios } from '@/lib/api/portfolio'

// Helper function to safely create dates
function safeDate(dateValue: any): Date {
  if (!dateValue) return new Date()
  const date = new Date(dateValue)
  return isNaN(date.getTime()) ? new Date() : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://i-damoa.com'

  // Static pages - 메인 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    // 메인
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 업체찾기
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // 자료실
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 견적의뢰
    {
      url: `${baseUrl}/estimates`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 상담신청
    {
      url: `${baseUrl}/consultations`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 공지/이벤트
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // 플래너
    {
      url: `${baseUrl}/planner`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 예상견적 계산기
    {
      url: `${baseUrl}/estimate-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 이용약관
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // 개인정보처리방침
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // 문의하기
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch company pages - 업체 상세 페이지
  let companyPages: MetadataRoute.Sitemap = []
  try {
    const companiesResult = await getCompanies({ page: 0, size: 500 })
    if (companiesResult.success && companiesResult.data) {
      companyPages = companiesResult.data.content.map((company) => ({
        url: `${baseUrl}/companies/${company.slug || company.uuid}`,
        lastModified: safeDate(company.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch companies for sitemap:', error)
  }

  // Fetch public estimate pages - 공개 견적 요청 페이지
  let estimatePages: MetadataRoute.Sitemap = []
  try {
    const estimatesResult = await getEstimateRequests(0, 200, 'createdAt,desc')
    if (estimatesResult.success && estimatesResult.data) {
      estimatePages = estimatesResult.data.content
        .filter((estimate) => estimate.visibility === 'PUBLIC' && estimate.status === 'PUBLISHED')
        .map((estimate) => ({
          url: `${baseUrl}/estimates/${estimate.uuid}`,
          lastModified: safeDate(estimate.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
    }
  } catch (error) {
    console.error('Failed to fetch estimates for sitemap:', error)
  }

  // Fetch resource pages - 자료실 상세 페이지
  let resourcePages: MetadataRoute.Sitemap = []
  try {
    const resourcesResult = await searchDocuments({ page: 0, size: 200 })
    if (resourcesResult.success && resourcesResult.data) {
      resourcePages = resourcesResult.data.content.map((doc) => ({
        url: `${baseUrl}/resources/${doc.uuid}`,
        lastModified: safeDate(doc.updatedAt || doc.createdAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch resources for sitemap:', error)
  }

  // Fetch notice/event pages - 공지/이벤트 상세 페이지
  let noticePages: MetadataRoute.Sitemap = []
  try {
    const noticesResult = await searchNoticeEvents({ page: 0, size: 200 })
    if (noticesResult.success && noticesResult.data) {
      noticePages = noticesResult.data.content.map((notice) => ({
        url: `${baseUrl}/notices/${notice.uuid}`,
        lastModified: safeDate(notice.publishedAt || notice.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch notices for sitemap:', error)
  }

  // Fetch portfolio pages - 포트폴리오 상세 페이지
  let portfolioPages: MetadataRoute.Sitemap = []
  try {
    const portfoliosResult = await searchPortfolios({ page: 0, size: 500 })
    if (portfoliosResult.success && portfoliosResult.data) {
      portfolioPages = portfoliosResult.data.content.map((portfolio) => ({
        url: `${baseUrl}/portfolios/${portfolio.uuid}`,
        lastModified: safeDate(portfolio.updatedAt || portfolio.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch portfolios for sitemap:', error)
  }

  return [
    ...staticPages,
    ...companyPages,
    ...estimatePages,
    ...resourcePages,
    ...noticePages,
    ...portfolioPages,
  ]
}
