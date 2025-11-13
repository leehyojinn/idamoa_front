/**
 * Auth API React Query Mutations
 * 기존 useAuth는 zustand와 함께 사용하므로 별도로 mutation hooks를 제공
 */

import { useMutation } from '@tanstack/react-query'
import {
  signupStart,
  sendEmailVerification,
  verifyEmail,
  completeSignup,
  getKakaoAuthUrl,
  getNaverAuthUrl,
  getGoogleAuthUrl,
  type SignupStartRequest,
  type SignupStartResponse,
  type SendEmailVerificationRequest,
  type VerifyEmailRequest,
  type CompleteSignupRequest,
  type CompleteSignupResponse,
  type OAuthAuthorizeResponse,
} from '@/lib/api/auth'

// ========================================
// Mutations
// ========================================

/**
 * 회원가입 시작
 */
export const useSignupStart = () => {
  return useMutation<SignupStartResponse, Error, SignupStartRequest>({
    mutationFn: signupStart,
  })
}

/**
 * 이메일 인증 코드 발송
 */
export const useSendEmailVerification = () => {
  return useMutation<
    { success: boolean },
    Error,
    SendEmailVerificationRequest
  >({
    mutationFn: sendEmailVerification,
  })
}

/**
 * 이메일 인증 코드 확인
 */
export const useVerifyEmail = () => {
  return useMutation<{ success: boolean }, Error, VerifyEmailRequest>({
    mutationFn: verifyEmail,
  })
}

/**
 * 회원가입 완료
 */
export const useCompleteSignup = () => {
  return useMutation<CompleteSignupResponse, Error, CompleteSignupRequest>({
    mutationFn: completeSignup,
  })
}

/**
 * 카카오 OAuth URL 조회
 */
export const useKakaoAuthUrl = () => {
  return useMutation<OAuthAuthorizeResponse, Error, void>({
    mutationFn: getKakaoAuthUrl,
  })
}

/**
 * 네이버 OAuth URL 조회
 */
export const useNaverAuthUrl = () => {
  return useMutation<OAuthAuthorizeResponse, Error, void>({
    mutationFn: getNaverAuthUrl,
  })
}

/**
 * 구글 OAuth URL 조회
 */
export const useGoogleAuthUrl = () => {
  return useMutation<OAuthAuthorizeResponse, Error, void>({
    mutationFn: getGoogleAuthUrl,
  })
}
