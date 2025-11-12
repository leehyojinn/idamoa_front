/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',

  // CSS preload 경고 해결을 위한 최적화 설정
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    optimizeCss: true, // CSS 최적화 활성화
  },
}

export default nextConfig