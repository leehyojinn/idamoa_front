/**
 * 에러 처리 유틸리티
 * API 에러를 사용자 친화적인 메시지로 변환합니다
 */

import toast from 'react-hot-toast'

// 에러 코드별 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  // 인증 관련
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일입니다',
  EMAIL_NOT_VERIFIED: '이메일 인증이 완료되지 않았습니다',
  INVALID_VERIFICATION_CODE: '인증 코드가 올바르지 않습니다',
  VERIFICATION_CODE_EXPIRED: '인증 코드가 만료되었습니다',
  TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요',
  INVALID_TOKEN: '유효하지 않은 인증 정보입니다',
  UNAUTHORIZED: '로그인이 필요합니다',

  // 사용자 관련
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다',
  PROFILE_NOT_COMPLETED: '프로필 설정을 완료해주세요',

  // 서버 에러
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
  BAD_REQUEST: '잘못된 요청입니다',
  FORBIDDEN: '접근 권한이 없습니다',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',

  // 네트워크 에러
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요',

  // 기타
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
}

/**
 * HTTP 상태 코드별 기본 메시지
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다',
  401: '로그인이 필요합니다',
  403: '접근 권한이 없습니다',
  404: '요청한 정보를 찾을 수 없습니다',
  409: '이미 존재하는 정보입니다',
  422: '입력 정보를 확인해주세요',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
  500: '서버 오류가 발생했습니다',
  502: '서버에 연결할 수 없습니다',
  503: '서비스를 일시적으로 사용할 수 없습니다',
}

interface ApiErrorResponse {
  status: number
  data?: {
    errorCode?: string
    message?: string
  }
}

interface ApiError extends Error {
  response?: ApiErrorResponse
  request?: XMLHttpRequest
  code?: string
  config?: {
    url?: string
    method?: string
  }
}

// 타입 가드 함수
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'request' in error || 'code' in error)
  )
}

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export const getErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) {
    if (error instanceof Error) {
      return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
    }
    return ERROR_MESSAGES.UNKNOWN_ERROR
  }

  const apiError = error

  // 1. 서버에서 보낸 에러 코드가 있는 경우
  if (apiError.response?.data?.errorCode) {
    const errorCode = apiError.response.data.errorCode
    if (ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode]
    }
  }

  // 2. 서버에서 보낸 메시지가 있는 경우
  if (apiError.response?.data?.message) {
    return apiError.response.data.message
  }

  // 3. HTTP 상태 코드로 메시지 결정
  if (apiError.response?.status) {
    const status = apiError.response.status
    if (STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status]
    }
  }

  // 4. 네트워크 에러
  if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT
  }

  if (apiError.request && !apiError.response) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  // 5. 기본 메시지
  return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * 에러를 토스트로 표시
 * error 객체가 있으면 서버 에러 메시지를 우선 사용, 없으면 fallbackMessage 사용
 */
export const showErrorToast = (error: unknown, fallbackMessage?: string): void => {
  const parsedMessage = error ? getErrorMessage(error) : null
  // 서버 에러 메시지가 있으면 우선 사용, 없으면 fallbackMessage 사용
  const message = parsedMessage && parsedMessage !== ERROR_MESSAGES.UNKNOWN_ERROR
    ? parsedMessage
    : (fallbackMessage || parsedMessage || ERROR_MESSAGES.UNKNOWN_ERROR)
  toast.error(message)
}

/**
 * 성공 메시지를 토스트로 표시
 */
export const showSuccessToast = (message: string): void => {
  toast.success(message)
}

/**
 * 개발 환경에서만 에러 로깅
 */
export const logError = (context: string, error: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error)
  }
}

/**
 * 개발 환경에서만 일반 로깅
 */
export const logInfo = (context: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${context}]`, ...args)
  }
}

/**
 * 에러 객체에서 필요한 정보만 추출 (에러 리포팅용)
 */
export const sanitizeError = (error: unknown) => {
  if (!isApiError(error)) {
    return {
      status: undefined,
      errorCode: undefined,
      message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      timestamp: new Date().toISOString(),
    }
  }

  return {
    status: error.response?.status,
    errorCode: error.response?.data?.errorCode,
    message: getErrorMessage(error),
    timestamp: new Date().toISOString(),
  }
}
