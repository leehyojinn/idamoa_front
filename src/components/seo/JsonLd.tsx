'use client'

interface OrganizationSchemaProps {
  name?: string
  url?: string
  logo?: string
  description?: string
}

export function OrganizationSchema({
  name = '인테리어 다모아',
  url = 'https://i-damoa.com',
  logo = 'https://i-damoa.com/images/seo-image-v002.png',
  description = '인테리어 전문 업체를 한눈에! 업체 비교, 견적 요청, 포트폴리오 확인까지 인테리어의 모든 것을 다모아에서 만나보세요.',
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Korean',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface WebSiteSchemaProps {
  name?: string
  url?: string
}

export function WebSiteSchema({
  name = '인테리어 다모아',
  url = 'https://i-damoa.com',
}: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/companies?keyword={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface LocalBusinessSchemaProps {
  name: string
  description?: string
  url: string
  image?: string
  address?: string
  telephone?: string
  email?: string
  rating?: number
  reviewCount?: number
  priceRange?: string
}

export function LocalBusinessSchema({
  name,
  description,
  url,
  image,
  address,
  telephone,
  email,
  rating,
  reviewCount,
  priceRange = '₩₩₩',
}: LocalBusinessSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name,
    url,
    priceRange,
  }

  if (description) schema.description = description
  if (image) schema.image = image
  if (telephone) schema.telephone = telephone
  if (email) schema.email = email

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressCountry: 'KR',
    }
  }

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ArticleSchemaProps {
  title: string
  description?: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  authorName?: string
}

export function ArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName = '인테리어 다모아',
}: ArticleSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    url,
    datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: '인테리어 다모아',
      logo: {
        '@type': 'ImageObject',
        url: 'https://i-damoa.com/images/seo-image-v002.png',
      },
    },
  }

  if (description) schema.description = description
  if (image) schema.image = image
  if (dateModified) schema.dateModified = dateModified

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
