# 인테리어 다모아 프론트엔드 인수인계 문서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 인테리어 다모아 (i-damoa) |
| 서비스 URL | https://i-damoa.com |
| 프로젝트 유형 | B2B/B2C 인테리어 업체-고객 매칭 플랫폼 |
| 프론트엔드 저장소 | https://github.com/leehyojinn/idamoa_front |

## 2. 기술 스택

### Core
- Next.js 15 (App Router)
- React 18
- TypeScript

### Styling
- Tailwind CSS
- Framer Motion (애니메이션)

### 상태 관리
- Zustand (전역 상태)
- React Query / TanStack Query (서버 상태)

### 폼 처리
- React Hook Form
- Zod (유효성 검증)

### 실시간 통신
- STOMP.js
- SockJS (WebSocket)

### 기타
- Axios (HTTP 클라이언트)
- Chart.js (차트)
- Swiper (슬라이더)

## 3. 프로젝트 구조

```
src/
├── app/                      # Next.js App Router 페이지
│   ├── (auth)/               # 인증 관련 (로그인, 회원가입)
│   ├── admin/                # 관리자 페이지
│   │   ├── companies/        # 업체 관리
│   │   ├── consultations/    # 상담 관리
│   │   ├── estimates/        # 견적 관리
│   │   ├── events/           # 이벤트 관리
│   │   ├── filters/          # 필터 카테고리 관리
│   │   ├── members/          # 회원 관리
│   │   ├── popups/           # 팝업 관리
│   │   ├── portfolios/       # 포트폴리오 관리
│   │   └── posts/            # 게시글 관리
│   ├── chat/                 # 실시간 채팅
│   ├── community/            # 커뮤니티 게시판
│   ├── companies/            # 업체 목록/상세
│   ├── consultations/        # 상담 신청
│   ├── estimates/            # 견적 의뢰
│   ├── mypage/               # 마이페이지
│   ├── portfolios/           # 포트폴리오 목록/상세/등록
│   └── page.tsx              # 메인 페이지
│
├── components/               # 재사용 컴포넌트
│   ├── admin/                # 관리자 전용 컴포넌트
│   ├── chat/                 # 채팅 컴포넌트
│   ├── community/            # 커뮤니티 컴포넌트
│   ├── layout/               # 레이아웃 (Navbar, Footer, Sidebar)
│   ├── portfolio/            # 포트폴리오 컴포넌트
│   ├── popup/                # 팝업 컴포넌트
│   ├── seo/                  # SEO 관련 (JSON-LD)
│   └── ui/                   # 공통 UI (Button, Input, Modal 등)
│
├── hooks/                    # 커스텀 훅
│   ├── useAuth.ts            # 인증 상태
│   ├── useChat.ts            # 채팅
│   └── ...
│
├── lib/                      # 유틸리티
│   ├── api/                  # API 호출 함수
│   │   ├── auth.ts           # 인증 API
│   │   ├── portfolio.ts      # 포트폴리오 API
│   │   ├── community.ts      # 커뮤니티 API
│   │   ├── estimate.ts       # 견적 API
│   │   └── ...
│   ├── axios.ts              # Axios 인스턴스 설정
│   ├── metadata.ts           # 메타데이터 유틸
│   └── errorHandler.ts       # 에러 처리
│
├── stores/                   # Zustand 스토어
│   ├── authStore.ts          # 인증 상태
│   ├── chatStore.ts          # 채팅 상태
│   └── ...
│
└── types/                    # TypeScript 타입 정의
```

## 4. 환경 설정

### 환경변수 (.env.local)

```env
# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://i-damoa.com

# Kakao 로그인
NEXT_PUBLIC_KAKAO_APP_KEY=카카오_앱_키

# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=토스_클라이언트_키

# CloudFront CDN
NEXT_PUBLIC_CDN_URL=https://d3bfejle0z37nw.cloudfront.net
```

### 개발 서버 실행

```bash
npm install
npm run dev
```

### 빌드 및 배포

```bash
npm run build
npm run start
```

## 5. 주요 기능 상세

### 5.1 인증 시스템
- JWT 기반 인증 (Access Token / Refresh Token)
- 소셜 로그인: 카카오, 네이버, 구글
- 역할: 일반회원(USER), 업체회원(COMPANY), 관리자(ADMIN)
- 파일: `src/lib/api/auth.ts`, `src/stores/authStore.ts`

### 5.2 포트폴리오
- 무한 스크롤 목록
- 계층형 필터 (공간 → 스타일, 평수, 지역 등)
- 이미지/동영상 다중 업로드
- 파일: `src/components/portfolio/`, `src/lib/api/portfolio.ts`

### 5.3 실시간 채팅
- WebSocket (STOMP.js) 기반
- 1:1 업체-고객 채팅
- 읽음 상태, 자동 재연결
- 파일: `src/components/chat/`, `src/hooks/useChat.ts`

### 5.4 견적 의뢰
- 다단계 폼 (위자드)
- 업체 제안서 시스템
- 파일: `src/app/estimates/`

### 5.5 커뮤니티
- 계층형 카테고리 게시판
- 댓글/대댓글
- 좋아요, 조회수
- 파일: `src/app/community/`, `src/components/community/`

### 5.6 관리자 대시보드
- 통계 차트 (Chart.js)
- 회원/업체/콘텐츠 관리
- 팝업/이벤트/필터 관리
- 파일: `src/app/admin/`

## 6. API 연동

### Base URL
- 개발: 백엔드 로컬 또는 개발 서버
- 운영: EC2 서버

### Axios 설정
- 파일: `src/lib/axios.ts`
- 인터셉터: 토큰 자동 첨부, 401 에러 시 토큰 갱신

### 주요 API 파일
| 파일 | 설명 |
|------|------|
| `src/lib/api/auth.ts` | 로그인, 회원가입, 토큰 갱신 |
| `src/lib/api/portfolio.ts` | 포트폴리오 CRUD |
| `src/lib/api/community.ts` | 커뮤니티 게시글/댓글 |
| `src/lib/api/estimate.ts` | 견적 의뢰/제안 |
| `src/lib/api/company.ts` | 업체 정보 |
| `src/lib/api/chat.ts` | 채팅방/메시지 |

## 7. SEO 설정

### Lighthouse SEO 100점 달성

- JSON-LD 구조화 데이터: `src/components/seo/JsonLd.tsx`
- 동적 메타데이터: `src/lib/metadata.ts`
- sitemap.xml: `src/app/sitemap.ts`
- robots.txt: `src/app/robots.ts`

### 메타데이터 사용법
```typescript
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '페이지 제목',
  description: '페이지 설명',
  path: '/page-path',
})
```

## 8. 배포 환경

### 현재 배포
- 플랫폼: AWS EC2
- 도메인: i-damoa.com

### 배포 프로세스
1. develop 브랜치에서 개발
2. master 브랜치로 PR/머지
3. 서버에서 pull & build & restart

## 9. 주의사항

### 코드 컨벤션
- TypeScript strict 모드 사용
- ESLint 규칙 준수
- 컴포넌트는 PascalCase, 함수는 camelCase

### 이미지 처리
- Next.js Image 컴포넌트 사용
- CloudFront CDN 경유
- WebP 자동 변환

### 상태 관리 원칙
- 서버 상태: React Query 사용
- 클라이언트 전역 상태: Zustand 사용
- 폼 상태: React Hook Form 사용

## 10. 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Query 문서](https://tanstack.com/query/latest)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

## 11. 연락처

문의사항이 있으시면 연락 부탁드립니다.

---

최종 업데이트: 2025년 2월
