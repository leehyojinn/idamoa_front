import { MetadataRoute } from 'next'
import { getCompanies } from '@/lib/api/company'
import { getEstimateRequests } from '@/lib/api/estimate'

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
    // 업체 목록
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // 사진
    {
      url: `${baseUrl}/photos`,
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
  ]

  // Fetch company pages - 업체 상세 페이지
  let companyPages: MetadataRoute.Sitemap = []
  try {
    const companiesResult = await getCompanies({ page: 0, size: 100 })
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
    const estimatesResult = await getEstimateRequests(0, 50, 'createdAt,desc')
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

  return [...staticPages, ...companyPages, ...estimatePages]
}
