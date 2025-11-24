import axiosInstance from '@/lib/axios'

// ========================================
// Types
// ========================================

export interface SignupStartRequest {
  email: string
  password: string
  termsAgreed: boolean
  privacyAgreed: boolean
  marketingAgreed: boolean
}

export interface SignupStartResponse {
  success: boolean
  data: {
    signupToken: string
    message: string
    expiresIn: number
  }
}

export interface SendEmailVerificationRequest {
  signupToken: string
  email: string
}

export interface VerifyEmailRequest {
  signupToken: string
  code: string
}

export interface CompleteSignupRequest {
  signupToken: string
}

export interface CompleteSignupResponse {
  success: boolean
  data: {
    grantType: string
    accessToken: string
    refreshToken: string
    profileCompleted: boolean
    currentRole: string
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    grantType: string
    accessToken: string
    refreshToken: string
    profileCompleted: boolean
    currentRole: string
  }
  errorCode: string | null
  message: string | null
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  success: boolean
  data: {
    grantType: string
    accessToken: string
    refreshToken: string
    profileCompleted: boolean
    currentRole: string
  }
  errorCode: string | null
  message: string | null
}

export interface LogoutResponse {
  success: boolean
  data: null
  errorCode: string | null
  message: string | null
}

export interface OAuthAuthorizeResponse {
  success: boolean
  data: {
    authorizationUrl: string
    message: string
  }
  errorCode: string | null
  message: string | null
}

export interface UserMeResponse {
  success: boolean
  data: {
    id: number
    email: string
    name?: string
    profileCompleted: boolean
    roles: string[]
    isAdmin: boolean
    isCompany: boolean
    isUser: boolean
    status: string
  }
  errorCode: string | null
  message: string | null
}

// ========================================
// API Functions
// ========================================

/**
 * 1단계: 회원가입 시작
 */
export const signupStart = async (
  data: SignupStartRequest
): Promise<SignupStartResponse> => {
  const response = await axiosInstance.post('/auth/signup/start', data)
  return response.data
}

/**
 * 2단계: 이메일 인증 코드 발송
 */
export const sendEmailVerification = async (
  data: SendEmailVerificationRequest
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    '/auth/verification/email/send',
    data
  )
  return response.data
}

/**
 * 2단계: 이메일 인증 코드 확인
 */
export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    '/auth/verification/email/verify',
    data
  )
  return response.data
}

/**
 * 2단계: 회원가입 완료 (User 생성)
 */
export const completeSignup = async (
  data: CompleteSignupRequest
): Promise<CompleteSignupResponse> => {
  const response = await axiosInstance.post('/auth/signup/complete', data)
  return response.data
}

/**
 * 로그인
 */
export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', data)
  return response.data
}

/**
 * 로그아웃
 */
export const logout = async (): Promise<LogoutResponse> => {
  const response = await axiosInstance.post('/auth/logout')
  return response.data
}

/**
 * 토큰 갱신 (refreshToken 직접 전달)
 */
export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<RefreshTokenResponse> => {
  const response = await axiosInstance.post('/auth/refresh', data)
  return response.data
}

/**
 * 토큰 갱신 (httpOnly 쿠키 사용 - OAuth 콜백용)
 * Refresh Token이 httpOnly 쿠키에 저장되어 있을 때 사용
 */
export const refreshTokenWithCookie = async (): Promise<RefreshTokenResponse> => {
  const response = await axiosInstance.post('/auth/refresh', {})
  return response.data
}

/**
 * 카카오 OAuth 인가 URL 받기
 */
export const getKakaoAuthUrl = async (): Promise<OAuthAuthorizeResponse> => {
  const response = await axiosInstance.get('/oauth/kakao/authorize')
  return response.data
}

/**
 * 네이버 OAuth 인가 URL 받기
 */
export const getNaverAuthUrl = async (): Promise<OAuthAuthorizeResponse> => {
  const response = await axiosInstance.get('/oauth/naver/authorize')
  return response.data
}

/**
 * 구글 OAuth 인가 URL 받기
 */
export const getGoogleAuthUrl = async (): Promise<OAuthAuthorizeResponse> => {
  const response = await axiosInstance.get('/oauth/google/authorize')
  return response.data
}

/**
 * 내 정보 조회
 */
export const getMyInfo = async (): Promise<UserMeResponse> => {
  const response = await axiosInstance.get('/auth/me')
  return response.data
}
