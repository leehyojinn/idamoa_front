# 인테리어 다모아 (i-damoa) Frontend

인테리어 업체와 고객을 연결하는 B2B/B2C 플랫폼의 프론트엔드 프로젝트입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand, React Query (TanStack Query)
- **Form**: React Hook Form, Zod
- **Real-time**: STOMP.js, SockJS (WebSocket)
- **Chart**: Chart.js, React-chartjs-2
- **HTTP Client**: Axios

## 주요 기능

- 포트폴리오 등록/조회/검색 (무한스크롤, 필터링)
- 업체 검색 및 프로필
- 견적 의뢰 시스템
- 실시간 1:1 채팅
- 커뮤니티 게시판
- 관리자 대시보드
- 소셜 로그인 (OAuth 2.0)

## 시작하기

### 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm run start
```

### 환경변수

`.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
NEXT_PUBLIC_API_URL=백엔드 API URL
NEXT_PUBLIC_WS_URL=WebSocket URL
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── admin/              # 관리자 페이지
│   ├── community/          # 커뮤니티
│   ├── companies/          # 업체
│   ├── estimates/          # 견적
│   ├── portfolios/         # 포트폴리오
│   └── ...
├── components/             # 재사용 컴포넌트
│   ├── layout/             # 레이아웃 (Navbar, Footer 등)
│   ├── ui/                 # UI 컴포넌트 (Button, Input 등)
│   ├── portfolio/          # 포트폴리오 관련
│   ├── community/          # 커뮤니티 관련
│   └── ...
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티, API 함수
│   ├── api/                # API 호출 함수
│   └── ...
├── stores/                 # Zustand 스토어
└── types/                  # TypeScript 타입 정의
```

## 스크립트

```bash
npm run dev        # 개발 서버 실행 (포트 3000)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run lint       # ESLint 검사
```

## SEO

- Lighthouse SEO 100점 달성
- JSON-LD 구조화 데이터 적용
- 동적 메타데이터 생성
- sitemap.xml, robots.txt 설정

## 배포

Vercel 또는 기타 Next.js 호환 플랫폼에서 배포 가능합니다.

## 라이선스

Private
