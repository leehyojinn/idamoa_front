/**
 * 클래스명을 조합하는 유틸리티 함수
 * @param  {...any} classes - 조합할 클래스명들
 * @returns {string} 조합된 클래스명
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 날짜를 포맷팅하는 함수
 * @param {Date} date - 포맷팅할 날짜
 * @returns {string} 포맷팅된 날짜 문자열
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 숫자를 천 단위로 포맷팅하는 함수
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 포맷팅된 숫자 문자열
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

/**
 * 전화번호에 자동으로 하이픈을 추가하는 함수
 * @param {string} value - 입력된 전화번호 (숫자만 또는 하이픈 포함)
 * @returns {string} 하이픈이 추가된 전화번호
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return ''
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '')

  // 빈 문자열이면 그대로 반환
  if (!numbers) return ''

  // 휴대폰 번호 (010, 011, 016, 017, 018, 019)
  if (numbers.startsWith('01')) {
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  // 서울 지역번호 (02)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5, 9)}`
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }
  }

  // 지역번호 (031, 032, 033, 041, 042, 043, 051, 052, 053, 054, 055, 061, 062, 063, 064)
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

/**
 * 전화번호에서 하이픈을 제거하는 함수
 * @param {string} value - 하이픈이 포함된 전화번호
 * @returns {string} 숫자만 포함된 전화번호
 */
export function removePhoneHyphens(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/[^\d]/g, '')
}

/**
 * 사업자 등록번호에 자동으로 하이픈 추가
 * @param {string} value - 입력된 값
 * @returns {string} 형식화된 사업자 등록번호 (XXX-XX-XXXXX)
 */
export function formatBusinessNumber(value: string | null | undefined): string {
  if (!value) return ''
  const numbers = value.replace(/[^\d]/g, '')
  if (!numbers) return ''

  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  }
}

/**
 * URL에 자동으로 https:// 프로토콜 추가
 * @param {string} value - 입력된 URL
 * @returns {string} 프로토콜이 포함된 URL
 */
export function formatUrl(value: string): string {
  if (!value || value.trim() === '') return ''

  const trimmed = value.trim()

  // 이미 http:// 또는 https://로 시작하면 그대로 반환
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // 그 외의 경우 https:// 추가
  return `https://${trimmed}`
}

/**
 * 이미지 blur placeholder용 base64 데이터
 * 1x1 투명 회색 픽셀
 */
export const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwYABQgB/QHH6/AAAAAASUVORK5CYII='

/**
 * shimmer 효과를 위한 CSS 그라데이션
 */
export const shimmerStyle = {
  backgroundImage: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
}

/**
 * S3 URL을 CloudFront CDN URL로 변환하는 함수
 * NEXT_PUBLIC_CDN_URL이 설정되어 있으면 S3 URL을 CloudFront URL로 변환
 * @param {string} url - 원본 이미지 URL (S3 또는 기타)
 * @returns {string} CDN URL 또는 원본 URL
 */
export function getCdnUrl(url: string | null | undefined): string {
  if (!url) return ''

  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL

  // CDN URL이 설정되지 않았으면 원본 반환
  if (!cdnUrl) return url

  // S3 URL 패턴 확인 (여러 리전 지원)
  // 예: https://bucket-name.s3.ap-northeast-2.amazonaws.com/path/to/image.jpg
  // 예: https://bucket-name.s3.amazonaws.com/path/to/image.jpg
  const s3Pattern = /^https?:\/\/([^.]+)\.s3[.-]([^.]+)?\.?amazonaws\.com\/(.*)/
  const match = url.match(s3Pattern)

  if (match) {
    const path = match[3] // S3 경로 추출
    // CDN URL 끝에 슬래시가 있으면 제거
    const baseUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl
    return `${baseUrl}/${path}`
  }

  // S3 URL이 아니면 원본 반환
  return url
}
