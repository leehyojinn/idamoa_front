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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://damoa.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/estimates`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/estimate-calculator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Fetch company pages
  let companyPages: MetadataRoute.Sitemap = []
  try {
    const companiesResult = await getCompanies({ page: 0, size: 100 })
    if (companiesResult.success && companiesResult.data) {
      companyPages = companiesResult.data.content.map((company) => ({
        url: `${baseUrl}/companies/${company.slug || company.uuid}`,
        lastModified: safeDate(company.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch companies for sitemap:', error)
  }

  // Fetch public estimate pages
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
