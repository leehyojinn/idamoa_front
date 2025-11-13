/**
 * 비밀번호 관련 API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========== 비밀번호 찾기 (로그인 불필요) ==========

/**
 * 1단계: 비밀번호 재설정 시작
 */
export interface ResetStartRequest {
  email: string
}

export interface ResetStartResponse {
  resetToken: string
  message: string
  expiresIn: number
}

export const startPasswordReset = async (
  data: ResetStartRequest
): Promise<ApiResponse<ResetStartResponse>> => {
  const response = await axiosInstance.post('/auth/password/reset/start', data)
  return response.data
}

/**
 * 2단계: 비밀번호 재설정 인증 코드 발송
 */
export interface VerificationSendRequest {
  resetToken: string
  email: string
}

export const sendResetVerificationCode = async (
  data: VerificationSendRequest
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/auth/password/reset/verification/send', data)
  return response.data
}

/**
 * 3단계: 비밀번호 재설정 인증 코드 확인
 */
export interface VerificationVerifyRequest {
  resetToken: string
  code: string
}

export const verifyResetCode = async (
  data: VerificationVerifyRequest
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/auth/password/reset/verification/verify', data)
  return response.data
}

/**
 * 4단계: 비밀번호 재설정 완료
 */
export interface ResetCompleteRequest {
  resetToken: string
  newPassword: string
}

export const completePasswordReset = async (
  data: ResetCompleteRequest
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/auth/password/reset/complete', data)
  return response.data
}

// ========== 비밀번호 변경 (로그인 필요) ==========

/**
 * 비밀번호 변경 (로그인 상태)
 */
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export const changePassword = async (
  data: PasswordChangeRequest
): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.post('/auth/password/change', data)
  return response.data
}
