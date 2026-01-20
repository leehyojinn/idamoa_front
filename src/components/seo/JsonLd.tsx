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

// FAQ 스키마 - 검색 결과에서 FAQ 리치 스니펫으로 표시
interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  items: FAQItem[]
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// 서비스 스키마 - 인테리어 서비스 정보
interface ServiceSchemaProps {
  name: string
  description: string
  provider?: string
  areaServed?: string
  url?: string
}

export function ServiceSchema({
  name,
  description,
  provider = '인테리어 다모아',
  areaServed = '대한민국',
  url = 'https://i-damoa.com',
}: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
    },
    areaServed: {
      '@type': 'Country',
      name: areaServed,
    },
    url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// HowTo 스키마 - 가이드 페이지용
interface HowToStep {
  name: string
  text: string
  image?: string
}

interface HowToSchemaProps {
  name: string
  description: string
  steps: HowToStep[]
  totalTime?: string
}

export function HowToSchema({ name, description, steps, totalTime }: HowToSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  }

  if (totalTime) {
    schema.totalTime = totalTime
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// 이미지 갤러리 스키마 - 포트폴리오용
interface ImageGalleryImage {
  url: string
  name?: string
  description?: string
  width?: number
  height?: number
}

interface ImageGallerySchemaProps {
  name: string
  description?: string
  url: string
  images: ImageGalleryImage[]
  author?: string
  datePublished?: string
}

export function ImageGallerySchema({
  name,
  description,
  url,
  images,
  author = '인테리어 다모아',
  datePublished,
}: ImageGallerySchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name,
    url,
    author: {
      '@type': 'Organization',
      name: author,
    },
    image: images.map((img, index) => ({
      '@type': 'ImageObject',
      url: img.url,
      name: img.name || `${name} 이미지 ${index + 1}`,
      description: img.description || description,
      ...(img.width && { width: img.width }),
      ...(img.height && { height: img.height }),
    })),
  }

  if (description) schema.description = description
  if (datePublished) schema.datePublished = datePublished

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// 토론/커뮤니티 게시글 스키마
interface DiscussionPostSchemaProps {
  title: string
  content: string
  url: string
  authorName: string
  datePublished: string
  dateModified?: string
  commentCount?: number
  likeCount?: number
  image?: string
}

export function DiscussionPostSchema({
  title,
  content,
  url,
  authorName,
  datePublished,
  dateModified,
  commentCount,
  likeCount,
  image,
}: DiscussionPostSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: title,
    text: content.substring(0, 500),
    url,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    datePublished,
    publisher: {
      '@type': 'Organization',
      name: '인테리어 다모아',
      logo: {
        '@type': 'ImageObject',
        url: 'https://i-damoa.com/images/seo-image-v003.png',
      },
    },
  }

  if (dateModified) schema.dateModified = dateModified
  if (commentCount !== undefined) schema.commentCount = commentCount
  if (likeCount !== undefined) {
    schema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: likeCount,
    }
  }
  if (image) schema.image = image

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
