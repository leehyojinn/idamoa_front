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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://i-damoa.com'

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

  // 모든 API 호출을 병렬로 실행
  const [
    companiesResult,
    estimatesResult,
    resourcesResult,
    noticesResult,
    portfoliosResult,
  ] = await Promise.all([
    getCompanies({ page: 0, size: 500 }).catch((error) => {
      console.error('Failed to fetch companies for sitemap:', error)
      return { success: false, data: null }
    }),
    getEstimateRequests(0, 200, 'createdAt,desc').catch((error) => {
      console.error('Failed to fetch estimates for sitemap:', error)
      return { success: false, data: null }
    }),
    searchDocuments({ page: 0, size: 200 }).catch((error) => {
      console.error('Failed to fetch resources for sitemap:', error)
      return { success: false, data: null }
    }),
    searchNoticeEvents({ page: 0, size: 200 }).catch((error) => {
      console.error('Failed to fetch notices for sitemap:', error)
      return { success: false, data: null }
    }),
    searchPortfolios({ page: 0, size: 500 }).catch((error) => {
      console.error('Failed to fetch portfolios for sitemap:', error)
      return { success: false, data: null }
    }),
  ])

  // 업체 상세 페이지
  const companyPages: MetadataRoute.Sitemap =
    companiesResult.success && companiesResult.data
      ? companiesResult.data.content.map((company) => ({
          url: `${baseUrl}/companies/${company.slug || company.uuid}`,
          lastModified: safeDate(company.createdAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : []

  // 공개 견적 요청 페이지
  const estimatePages: MetadataRoute.Sitemap =
    estimatesResult.success && estimatesResult.data
      ? estimatesResult.data.content
          .filter((estimate) => estimate.visibility === 'PUBLIC' && estimate.status === 'PUBLISHED')
          .map((estimate) => ({
            url: `${baseUrl}/estimates/${estimate.uuid}`,
            lastModified: safeDate(estimate.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }))
      : []

  // 자료실 상세 페이지
  const resourcePages: MetadataRoute.Sitemap =
    resourcesResult.success && resourcesResult.data
      ? resourcesResult.data.content.map((doc) => ({
          url: `${baseUrl}/resources/${doc.uuid}`,
          lastModified: safeDate(doc.updatedAt || doc.createdAt),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      : []

  // 공지/이벤트 상세 페이지
  const noticePages: MetadataRoute.Sitemap =
    noticesResult.success && noticesResult.data
      ? noticesResult.data.content.map((notice) => ({
          url: `${baseUrl}/notices/${notice.uuid}`,
          lastModified: safeDate(notice.publishedAt || notice.createdAt),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        }))
      : []

  // 포트폴리오 상세 페이지
  const portfolioPages: MetadataRoute.Sitemap =
    portfoliosResult.success && portfoliosResult.data
      ? portfoliosResult.data.content.map((portfolio) => ({
          url: `${baseUrl}/portfolios/${portfolio.uuid}`,
          lastModified: safeDate(portfolio.updatedAt || portfolio.createdAt),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        }))
      : []

  return [
    ...staticPages,
    ...companyPages,
    ...estimatePages,
    ...resourcePages,
    ...noticePages,
    ...portfolioPages,
  ]
}
