import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Docker 배포를 위한 standalone 빌드
  reactStrictMode: true,
  productionBrowserSourceMaps: false, // 프로덕션에서 소스맵 비활성화

  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizePackageImports: ['react-icons', 'date-fns'], // 패키지 임포트 최적화
  },

  // 압축 및 최적화
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 이미지 최적화 설정
  images: {
    // Next.js 이미지 최적화 비활성화 (S3/CloudFront에서 직접 로드)
    // /_next/image 프록시를 거치지 않아 훨씬 빠름
    unoptimized: true,
    remotePatterns: [
      // S3 직접 접근
      {
        protocol: 'https',
        hostname: 'hip-damoa-uploads-local.s3.ap-northeast-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'hip-damoa-uploads.s3.ap-northeast-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.ap-northeast-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      // CloudFront CDN
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      // 기타 CDN
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp'], // WebP만 사용 (AVIF는 인코딩 느림)
    deviceSizes: [640, 1080, 1920], // 3개로 축소: 모바일, 태블릿, 데스크탑
    imageSizes: [128, 384], // 2개로 축소: 썸네일, 작은 이미지
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1년 캐시
    dangerouslyAllowSVG: true, // SVG 허용
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack 최적화 - Next.js 기본 설정 사용
  webpack: (config) => {
    return config
  },

  // 헤더 설정 (캐싱 및 보안)
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default bundleAnalyzer(nextConfig)