import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://i-damoa.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/mypage/',
          '/admin/',
          '/api/',
          '/login',
          '/signup/',
          '/password/',
          '/oauth/',
          '/auth/',
          '/company-dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
