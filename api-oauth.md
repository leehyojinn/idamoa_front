# 소셜 로그인 (OAuth) API 문서

## 목차
1. [개요](#개요)
2. [지원 소셜 로그인](#지원-소셜-로그인)
3. [인증 플로우](#인증-플로우)
4. [API 엔드포인트](#api-엔드포인트)
   - [카카오 로그인 URL 생성](#1-카카오-로그인-url-생성)
   - [카카오 Callback](#2-카카오-callback)
   - [네이버 로그인 URL 생성](#3-네이버-로그인-url-생성)
   - [네이버 Callback](#4-네이버-callback)
   - [구글 로그인 URL 생성](#5-구글-로그인-url-생성)
   - [구글 Callback](#6-구글-callback)
   - [토큰 갱신](#7-토큰-갱신)
5. [Next.js 구현 예시](#nextjs-구현-예시)

---

## 개요

OAuth 2.0 기반의 소셜 로그인 기능을 제공합니다. 사용자는 카카오, 네이버, 구글 계정으로 간편하게 로그인할 수 있습니다.

### 보안 특징
- **CSRF 방지**: State 파라미터를 Redis에 저장하여 검증 (10분 TTL)
- **XSS 방지**: Refresh Token을 HttpOnly 쿠키에 저장
- **Access Token 보호**: URL에 노출하지 않고 `/api/auth/refresh` API로 발급
- **자동 연동 방지**: 기존 이메일 계정이 있는 경우 자동 소셜 연동 금지

### Base URL
```
/api/oauth
```

---

## 지원 소셜 로그인

| Provider | 설명 |
|----------|------|
| `kakao` | 카카오 로그인 |
| `naver` | 네이버 로그인 |
| `google` | 구글 로그인 |

---

## 인증 플로우

### 전체 플로우 다이어그램

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │      │   Backend   │      │    Redis    │      │  OAuth서버  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │                    │
       │ 1. 로그인 버튼 클릭  │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │ GET /api/oauth/{provider}/authorize     │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │ 2. State 저장      │                    │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │ 3. authorizationUrl│                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │ 4. 소셜 로그인 페이지 리다이렉트          │                    │
       │────────────────────────────────────────────────────────────>│
       │                    │                    │                    │
       │                    │                    │  5. 사용자 인증     │
       │                    │                    │<───────────────────│
       │                    │                    │                    │
       │ 6. Callback (code, state)               │                    │
       │────────────────────────────────────────>│                    │
       │                    │                    │                    │
       │                    │ 7. State 검증      │                    │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │ 8. Access Token 요청│                   │
       │                    │───────────────────────────────────────>│
       │                    │                    │                    │
       │                    │ 9. 사용자 정보 요청 │                    │
       │                    │───────────────────────────────────────>│
       │                    │                    │                    │
       │                    │ 10. JWT 생성 & Refresh Token Redis 저장 │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │ 11. 리다이렉트 + HttpOnly Cookie (Refresh Token)            │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │ 12. /api/auth/refresh 호출              │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │ 13. Access Token 발급                   │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
```

### 플로우 설명

1. **Frontend**: 소셜 로그인 버튼 클릭
2. **Frontend → Backend**: `GET /api/oauth/{provider}/authorize` 호출
3. **Backend**: State 생성 후 Redis에 저장 (CSRF 방지)
4. **Backend → Frontend**: `authorizationUrl` 반환
5. **Frontend**: 소셜 로그인 페이지로 리다이렉트
6. **소셜 서버**: 사용자 인증 후 Callback URL로 리다이렉트
7. **Backend**: State 검증 (Redis 조회)
8. **Backend → 소셜 서버**: Authorization Code로 Access Token 요청
9. **Backend → 소셜 서버**: 사용자 정보 조회
10. **Backend**:
    - 신규 사용자: User 생성 + SocialAccount 생성
    - 기존 사용자: SocialAccount 정보 업데이트
    - JWT 토큰 생성 및 Refresh Token Redis 저장
11. **Backend → Frontend**:
    - Refresh Token을 HttpOnly 쿠키에 저장
    - 프론트엔드 페이지로 리다이렉트 (`?success=true&requiresProfileSetup=true/false`)
12. **Frontend**: `/api/auth/refresh` API 호출
13. **Backend → Frontend**: Access Token 발급

---

## API 엔드포인트

### 1. 카카오 로그인 URL 생성

카카오 OAuth 인가 URL을 생성합니다.

#### Endpoint
```
GET /api/oauth/kakao/authorize
```

#### Headers
```
없음 (인증 불필요)
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://kauth.kakao.com/oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code&state=xxx",
    "message": "kakao 로그인을 진행해주세요"
  },
  "errorCode": null,
  "message": null
}
```

#### Response Fields

| 필드 | 타입 | 설명 |
|------|------|------|
| authorizationUrl | String | 카카오 로그인 페이지 URL (이 URL로 리다이렉트) |
| message | String | 안내 메시지 |

---

### 2. 카카오 Callback

카카오 인증 후 호출되는 Callback URL입니다. **직접 호출하지 않습니다.**

#### Endpoint
```
GET /api/oauth/kakao/callback
```

#### Query Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| code | String | 카카오에서 발급한 Authorization Code |
| state | String | CSRF 방지용 State 값 |

#### 동작
1. State 검증 (Redis)
2. Authorization Code로 Access Token 획득
3. 사용자 정보 조회
4. 신규/기존 사용자 처리
5. JWT 토큰 생성
6. **Refresh Token을 HttpOnly 쿠키에 저장**
7. 프론트엔드로 리다이렉트

#### 리다이렉트 URL
```
{FRONTEND_URL}/auth/callback?success=true&requiresProfileSetup=true
```

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| success | Boolean | 로그인 성공 여부 |
| requiresProfileSetup | Boolean | 프로필 완성 필요 여부 (신규 사용자) |

---

### 3. 네이버 로그인 URL 생성

#### Endpoint
```
GET /api/oauth/naver/authorize
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://nid.naver.com/oauth2.0/authorize?client_id=xxx&redirect_uri=xxx&response_type=code&state=xxx",
    "message": "naver 로그인을 진행해주세요"
  },
  "errorCode": null,
  "message": null
}
```

---

### 4. 네이버 Callback

```
GET /api/oauth/naver/callback?code={code}&state={state}
```

(카카오와 동일한 플로우)

---

### 5. 구글 로그인 URL 생성

#### Endpoint
```
GET /api/oauth/google/authorize
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=xxx&response_type=code&scope=email%20profile&state=xxx",
    "message": "google 로그인을 진행해주세요"
  },
  "errorCode": null,
  "message": null
}
```

---

### 6. 구글 Callback

```
GET /api/oauth/google/callback?code={code}&state={state}
```

(카카오와 동일한 플로우)

---

### 7. 토큰 갱신

HttpOnly 쿠키의 Refresh Token으로 새로운 Access Token을 발급받습니다.

#### Endpoint
```
POST /api/auth/refresh
```

#### Headers
```
Cookie: refreshToken=xxx  # 자동으로 전송됨
```

#### Request Body
```
없음
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "grantType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": null,
    "profileCompleted": false,
    "currentRole": "USER"
  },
  "errorCode": null,
  "message": null
}
```

#### Response Fields

| 필드 | 타입 | 설명 |
|------|------|------|
| grantType | String | 토큰 타입 (`Bearer`) |
| accessToken | String | 새로 발급된 Access Token |
| refreshToken | String | null (쿠키로 관리) |
| profileCompleted | Boolean | 프로필 완성 여부 |
| currentRole | String | 현재 역할 (`USER`, `COMPANY`, `ADMIN`) |

---

## 에러 응답

### 공통 에러 형식
```json
{
  "success": false,
  "data": null,
  "errorCode": "ERROR_CODE",
  "message": "에러 메시지"
}
```

### 주요 에러 코드

| HTTP Status | Error Code | 설명 |
|-------------|------------|------|
| 400 | OAUTH_EMAIL_NOT_PROVIDED | 소셜 계정에서 이메일을 제공하지 않음 |
| 400 | OAUTH_STATE_INVALID | State 값이 유효하지 않거나 만료됨 |
| 400 | OAUTH_PROVIDER_NOT_SUPPORTED | 지원하지 않는 소셜 로그인 제공자 |
| 409 | EMAIL_ALREADY_REGISTERED | 이미 가입된 이메일 (소셜 자동 연동 방지) |
| 401 | REFRESH_TOKEN_INVALID | Refresh Token이 유효하지 않음 |
| 401 | REFRESH_TOKEN_EXPIRED | Refresh Token이 만료됨 |

---

## Next.js 구현 예시

### 1. 타입 정의

```typescript
// types/auth.ts

export interface OAuthLoginResponse {
  authorizationUrl: string;
  message: string;
}

export interface TokenInfo {
  grantType: string;
  accessToken: string;
  refreshToken: string | null;
  profileCompleted: boolean;
  currentRole: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorCode: string | null;
  message: string | null;
}

export type OAuthProvider = 'kakao' | 'naver' | 'google';
```

### 2. API 클라이언트 설정

```typescript
// lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // 쿠키 전송 필수!
});

// Access Token 인터셉터
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 에러 시 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 Access Token 갱신
        const response = await apiClient.post('/api/auth/refresh');
        const { accessToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료됨 - 로그아웃 처리
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 3. OAuth API 함수

```typescript
// lib/api/oauth.ts
import { apiClient } from './client';
import type { OAuthLoginResponse, TokenInfo, ApiResponse, OAuthProvider } from '@/types/auth';

/**
 * 소셜 로그인 URL 가져오기
 */
export async function getOAuthLoginUrl(provider: OAuthProvider): Promise<string> {
  const response = await apiClient.get<ApiResponse<OAuthLoginResponse>>(
    `/api/oauth/${provider}/authorize`
  );
  return response.data.data.authorizationUrl;
}

/**
 * 토큰 갱신 (소셜 로그인 Callback 후 호출)
 */
export async function refreshToken(): Promise<TokenInfo> {
  const response = await apiClient.post<ApiResponse<TokenInfo>>(
    '/api/auth/refresh'
  );
  return response.data.data;
}

/**
 * 소셜 로그인 시작 (리다이렉트)
 */
export async function startOAuthLogin(provider: OAuthProvider): Promise<void> {
  const authUrl = await getOAuthLoginUrl(provider);
  window.location.href = authUrl;
}
```

### 4. 소셜 로그인 버튼 컴포넌트

```tsx
// components/auth/SocialLoginButtons.tsx
'use client';

import { useState } from 'react';
import { startOAuthLogin } from '@/lib/api/oauth';
import type { OAuthProvider } from '@/types/auth';

// 소셜 로그인 제공자 설정
const providers: { id: OAuthProvider; name: string; color: string; icon: string }[] = [
  { id: 'kakao', name: '카카오', color: 'bg-yellow-400 hover:bg-yellow-500', icon: '💬' },
  { id: 'naver', name: '네이버', color: 'bg-green-500 hover:bg-green-600 text-white', icon: 'N' },
  { id: 'google', name: '구글', color: 'bg-white hover:bg-gray-100 border', icon: 'G' },
];

export default function SocialLoginButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  const handleLogin = async (provider: OAuthProvider) => {
    setLoading(provider);
    try {
      await startOAuthLogin(provider);
    } catch (error) {
      console.error('소셜 로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-center text-gray-500 text-sm">소셜 계정으로 로그인</p>

      <div className="flex flex-col gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleLogin(provider.id)}
            disabled={loading !== null}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${provider.color} ${loading === provider.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-xl">{provider.icon}</span>
            {loading === provider.id ? '로그인 중...' : `${provider.name}로 로그인`}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 5. OAuth Callback 페이지

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { refreshToken } from '@/lib/api/oauth';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const requiresProfileSetup = searchParams.get('requiresProfileSetup');

      if (success !== 'true') {
        setStatus('error');
        setErrorMessage('로그인에 실패했습니다.');
        return;
      }

      try {
        // Refresh Token (쿠키)으로 Access Token 발급
        const tokenInfo = await refreshToken();

        // Access Token 저장
        localStorage.setItem('accessToken', tokenInfo.accessToken);

        setStatus('success');

        // 프로필 완성 필요 여부에 따라 리다이렉트
        if (requiresProfileSetup === 'true' || !tokenInfo.profileCompleted) {
          // 프로필 설정 페이지로 이동
          setTimeout(() => router.push('/profile/setup'), 1000);
        } else {
          // 메인 페이지로 이동
          setTimeout(() => router.push('/'), 1000);
        }
      } catch (error: any) {
        console.error('토큰 갱신 실패:', error);
        setStatus('error');
        setErrorMessage(error.response?.data?.message || '인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">로그인 처리 중...</h2>
            <p className="text-gray-500 mt-2">잠시만 기다려주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-600">로그인 성공!</h2>
            <p className="text-gray-500 mt-2">페이지를 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-600">로그인 실패</h2>
            <p className="text-gray-500 mt-2">{errorMessage}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              로그인 페이지로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### 6. 로그인 페이지

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // 이메일 로그인 처리...
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            로그인
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <SocialLoginButtons />
      </div>
    </div>
  );
}
```

### 7. 인증 상태 관리 (Context)

```tsx
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { refreshToken as apiRefreshToken } from '@/lib/api/oauth';

interface User {
  email: string;
  role: string;
  profileCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (accessToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    // 로그아웃 API 호출 (쿠키 삭제)
    // await apiClient.post('/api/auth/logout');
    window.location.href = '/login';
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        // Access Token 없으면 Refresh Token으로 시도
        const tokenInfo = await apiRefreshToken();
        localStorage.setItem('accessToken', tokenInfo.accessToken);
        setUser({
          email: '', // 별도 API로 조회 필요
          role: tokenInfo.currentRole,
          profileCompleted: tokenInfo.profileCompleted,
        });
      } else {
        // 기존 Access Token 유효성 확인 (사용자 정보 조회)
        // const userInfo = await getCurrentUser();
        // setUser(userInfo);
      }
    } catch (error) {
      // 인증 실패 - 로그아웃 상태
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 8. 인증 필요 페이지 보호

```tsx
// components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (!isLoading && requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 부록: cURL 테스트 예시

### 카카오 로그인 URL 가져오기
```bash
curl -X GET http://localhost:8080/api/oauth/kakao/authorize
```

### 토큰 갱신 (쿠키 포함)
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=your-refresh-token"
```

---

## 환경 변수 설정

### Backend (.env)
```properties
# OAuth 리다이렉트 기본 URL
oauth.redirect-base-url=http://localhost:8080

# 프론트엔드 리다이렉트 URL (Callback 후)
oauth.frontend-redirect-url=http://localhost:3000/auth/callback

# 카카오
oauth.kakao.client-id=your-kakao-client-id
oauth.kakao.client-secret=your-kakao-client-secret

# 네이버
oauth.naver.client-id=your-naver-client-id
oauth.naver.client-secret=your-naver-client-secret

# 구글
oauth.google.client-id=your-google-client-id
oauth.google.client-secret=your-google-client-secret
```

### Frontend (.env.local)
```properties
NEXT_PUBLIC_API_URL=http://localhost:8080
```
