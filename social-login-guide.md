# 소셜 로그인 API 가이드 (프론트엔드용)

## 지원 플랫폼
- 카카오 (Kakao)
- 네이버 (Naver)
- 구글 (Google)

---

## 전체 플로우 요약

```
1. 프론트엔드: 인가 URL 요청 → GET /api/oauth/{provider}/authorize
2. 프론트엔드: 받은 URL로 사용자 리다이렉트
3. 사용자: 소셜 로그인 진행 (카카오/네이버/구글 화면)
4. 백엔드: Callback 처리 → 프론트엔드로 리다이렉트
5. 프론트엔드: /api/auth/refresh 호출하여 Access Token 발급
```

---

## API 상세

### 1단계: 인가 URL 요청

소셜 로그인 버튼 클릭 시 호출

#### 카카오
```http
GET /api/oauth/kakao/authorize
```

#### 네이버
```http
GET /api/oauth/naver/authorize
```

#### 구글
```http
GET /api/oauth/google/authorize
```

#### 응답 JSON
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://kauth.kakao.com/oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code&state=xxx",
    "message": "카카오 로그인 페이지로 이동하세요"
  },
  "errorCode": null,
  "message": null
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `authorizationUrl` | String | 사용자를 리다이렉트시킬 소셜 로그인 URL |
| `message` | String | 안내 메시지 |

#### 프론트엔드 예시
```javascript
// 카카오 로그인 버튼 클릭 시
const handleKakaoLogin = async () => {
  const response = await fetch('/api/oauth/kakao/authorize');
  const result = await response.json();

  // 카카오 로그인 페이지로 이동
  window.location.href = result.data.authorizationUrl;
};
```

---

### 2단계: Callback 처리 (백엔드 자동 처리)

> 프론트엔드에서 직접 호출하지 않음!
> 백엔드가 소셜 플랫폼으로부터 Callback을 받아 처리 후 프론트엔드로 리다이렉트

#### Callback URL (백엔드에서 처리)
```
GET /api/oauth/kakao/callback?code=xxx&state=xxx
GET /api/oauth/naver/callback?code=xxx&state=xxx
GET /api/oauth/google/callback?code=xxx&state=xxx
```

#### 처리 결과
- **Refresh Token**: HttpOnly 쿠키에 자동 저장 (XSS 방지)
- **리다이렉트**: 프론트엔드 Callback 페이지로 이동

#### 리다이렉트 URL 형식
```
http://localhost:3000/auth/callback?success=true&requiresProfileSetup=false
```

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `success` | Boolean | 로그인 성공 여부 |
| `requiresProfileSetup` | Boolean | 프로필 설정 필요 여부 (신규 가입자: true) |

---

### 3단계: Access Token 발급

Callback 페이지에서 호출 (쿠키에 저장된 Refresh Token 사용)

```http
POST /api/auth/refresh
Content-Type: application/json
```

> **중요**: 쿠키가 자동으로 전송되므로 Request Body 없음

#### 응답 JSON
```json
{
  "success": true,
  "data": {
    "grantType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profileCompleted": false,
    "currentRole": "ROLE_USER"
  },
  "errorCode": null,
  "message": null
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `grantType` | String | 토큰 타입 (항상 "Bearer") |
| `accessToken` | String | API 호출에 사용할 JWT 토큰 |
| `profileCompleted` | Boolean | 프로필 설정 완료 여부 |
| `currentRole` | String | 현재 사용자 역할 (ROLE_USER, ROLE_COMPANY 등) |

#### 프론트엔드 예시
```javascript
// /auth/callback 페이지에서
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('success');
  const requiresProfileSetup = params.get('requiresProfileSetup');

  if (success === 'true') {
    // Access Token 발급 요청
    fetchAccessToken();
  }
}, []);

const fetchAccessToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',  // 쿠키 포함 필수!
  });

  const result = await response.json();

  if (result.success) {
    // Access Token 저장 (메모리 또는 상태관리)
    setAccessToken(result.data.accessToken);

    // 프로필 설정 필요 여부에 따라 라우팅
    if (!result.data.profileCompleted) {
      router.push('/profile/setup');
    } else {
      router.push('/');
    }
  }
};
```

---

## 쿠키 설정 정보

| 항목 | 값 |
|------|-----|
| 쿠키 이름 | `refreshToken` |
| 만료 기간 | 14일 |
| HttpOnly | true (JavaScript에서 접근 불가) |
| Secure | true (HTTPS 환경) / false (로컬 HTTP) |
| SameSite | None (HTTPS 환경) / 미설정 (로컬) |

---

## 전체 플로우 코드 예시 (React)

```jsx
// pages/login.jsx
export default function LoginPage() {
  const handleSocialLogin = async (provider) => {
    // provider: 'kakao', 'naver', 'google'
    const response = await fetch(`/api/oauth/${provider}/authorize`);
    const result = await response.json();

    if (result.success) {
      window.location.href = result.data.authorizationUrl;
    }
  };

  return (
    <div>
      <button onClick={() => handleSocialLogin('kakao')}>카카오 로그인</button>
      <button onClick={() => handleSocialLogin('naver')}>네이버 로그인</button>
      <button onClick={() => handleSocialLogin('google')}>구글 로그인</button>
    </div>
  );
}
```

```jsx
// pages/auth/callback.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');

    if (success === 'true') {
      completeLogin();
    } else {
      setError('로그인에 실패했습니다');
      setLoading(false);
    }
  }, []);

  const completeLogin = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',  // 쿠키 포함 필수!
      });

      const result = await response.json();

      if (result.success) {
        // Access Token 저장 (전역 상태 또는 Context)
        localStorage.setItem('accessToken', result.data.accessToken);

        // 프로필 설정 여부에 따라 분기
        if (!result.data.profileCompleted) {
          router.push('/profile/setup');
        } else {
          router.push('/');
        }
      } else {
        setError('토큰 발급에 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로그인 처리 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return null;
}
```

---

## API 호출 시 Access Token 사용

```javascript
// API 호출 예시
const fetchUserProfile = async () => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('/api/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};
```

---

## 에러 응답

### 인증 실패
```json
{
  "success": false,
  "data": null,
  "errorCode": "AUTH001",
  "message": "인증이 필요합니다"
}
```

### 토큰 만료
```json
{
  "success": false,
  "data": null,
  "errorCode": "AUTH003",
  "message": "토큰이 만료되었습니다"
}
```

> 토큰 만료 시 `/api/auth/refresh` 호출하여 갱신

---

## 시퀀스 다이어그램

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │  Social  │     │   User   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. GET /oauth/kakao/authorize   │                │
     │───────────────>│                │                │
     │                │                │                │
     │ 2. authorizationUrl             │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 3. Redirect to Kakao            │                │
     │────────────────────────────────>│                │
     │                │                │                │
     │                │                │ 4. 로그인/동의 │
     │                │                │<───────────────│
     │                │                │                │
     │                │ 5. Callback (code, state)       │
     │                │<───────────────│                │
     │                │                │                │
     │ 6. Redirect + Set-Cookie (refreshToken)         │
     │<───────────────│                │                │
     │                │                │                │
     │ 7. POST /auth/refresh           │                │
     │───────────────>│                │                │
     │                │                │                │
     │ 8. accessToken                  │                │
     │<───────────────│                │                │
     │                │                │                │
```

---

## 주의사항

1. **credentials: 'include'**: `/api/auth/refresh` 호출 시 반드시 포함
2. **Access Token 저장**: 메모리 또는 localStorage에 저장 (쿠키 X)
3. **토큰 갱신**: Access Token 만료 시 자동 갱신 로직 구현 권장
4. **CORS**: 크로스 도메인 환경에서는 백엔드 CORS 설정 확인 필요
