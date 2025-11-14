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
export function formatPhoneNumber(value: string): string {
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
export function removePhoneHyphens(value: string): string {
  return value.replace(/[^\d]/g, '')
}

/**
 * 사업자 등록번호에 자동으로 하이픈 추가
 * @param {string} value - 입력된 값
 * @returns {string} 형식화된 사업자 등록번호 (XXX-XX-XXXXX)
 */
export function formatBusinessNumber(value: string): string {
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
