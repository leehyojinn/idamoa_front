# 메타데이터 가이드

이 프로젝트에서는 모든 페이지에 SEO 최적화를 위한 메타데이터를 추가합니다.

## 설정된 메타데이터

### 기본 메타데이터 (전체 사이트)
- 위치: `src/lib/metadata.ts`
- 전역으로 사용되는 기본 메타태그 설정
- OpenGraph, Twitter Card, 검색엔진 최적화 포함

### 루트 레이아웃
- 위치: `src/app/layout.tsx`
- 사이트 기본 정보, 파비콘, Google Analytics 포함
- Google/Naver 검색 콘솔 인증 코드 포함

## 새 페이지에 메타데이터 추가하기

### 1. Server Component인 경우
페이지 파일에 직접 메타데이터를 export합니다.

```tsx
// src/app/your-page/page.tsx
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '페이지 제목',
  description: '페이지 설명 (150자 이내 권장)',
  path: '/your-page',
  keywords: ['키워드1', '키워드2', '키워드3'],
  noIndex: false, // 검색 노출 안할 경우 true
})

export default function YourPage() {
  // ...
}
```

### 2. Client Component ('use client')인 경우
같은 폴더에 `layout.tsx` 파일을 생성하고 메타데이터를 추가합니다.

```tsx
// src/app/your-page/layout.tsx
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata({
  title: '페이지 제목',
  description: '페이지 설명',
  path: '/your-page',
  keywords: ['키워드1', '키워드2'],
  noIndex: false,
})

export default function YourPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

## createPageMetadata 옵션

| 옵션 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | ✅ | 페이지 제목 (브라우저 탭에 표시) |
| description | string | ✅ | 페이지 설명 (검색 결과에 표시) |
| path | string | ❌ | 페이지 경로 (기본값: '') |
| keywords | string[] | ❌ | 검색 키워드 배열 |
| noIndex | boolean | ❌ | 검색 노출 제외 (기본값: false) |
| image | string | ❌ | OG 이미지 경로 (기본값: '/images/og-image.jpg') |

## 현재 설정된 페이지

### 검색 노출 페이지
- ✅ 홈 (`/`)
- ✅ 이용약관 (`/terms`)
- ✅ 개인정보처리방침 (`/privacy`)

### 검색 제외 페이지 (noIndex: true)
- ✅ 로그인 (`/login`)
- ✅ 회원가입 (`/signup`)
- ✅ 이메일 인증 (`/signup/verify`)
- ✅ 프로필 타입 선택 (`/signup/profile-type`)
- ✅ 사용자 프로필 (`/signup/profile/user`)
- ✅ 업체 프로필 (`/signup/profile/company`)
- ✅ 컴포넌트 데모 (`/components-demo`)

## 주의사항

1. **Client Component 제한**: `'use client'`를 사용하는 페이지는 직접 metadata를 export할 수 없습니다.
2. **Layout 사용**: Client Component인 경우 반드시 layout.tsx에서 메타데이터를 설정하세요.
3. **키워드 선택**: 너무 많은 키워드보다 관련성 높은 3-5개가 효과적입니다.
4. **설명 길이**: description은 150-160자 이내로 작성하는 것이 좋습니다.
5. **이미지**: OG 이미지는 1200x630px 권장합니다.

## 검색 콘솔 인증

### Google Search Console
- 인증 코드: `src/app/layout.tsx`의 `metadata.verification.google`에 설정
- 현재: `TJWb6qHYNW4dlSJfSbe0_yIFROOQL6F-yznCNiHAONE`

### Naver Search Advisor
- 인증 코드: `src/app/layout.tsx`의 `metadata.verification.other['naver-site-verification']`에 설정
- 현재: `af76a3049ba372f72bd2fadff2bfb3d128f0c3ae`

## 예제

### 일반 페이지
```tsx
export const metadata = createPageMetadata({
  title: '인테리어 사진',
  description: '다양한 인테리어 사진을 둘러보고 영감을 받아보세요.',
  path: '/photos',
  keywords: ['인테리어사진', '사진갤러리', '인테리어디자인'],
})
```

### 로그인이 필요한 페이지
```tsx
export const metadata = createPageMetadata({
  title: '마이페이지',
  description: '내 정보를 관리하고 활동 내역을 확인하세요.',
  path: '/mypage',
  keywords: ['마이페이지', '내정보'],
  noIndex: true, // 개인 페이지는 검색 제외
})
```

### 동적 페이지 (상세 페이지)
```tsx
// generateMetadata 사용
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchData(params.id)

  return createPageMetadata({
    title: data.title,
    description: data.description,
    path: `/items/${params.id}`,
    keywords: data.keywords,
    image: data.imageUrl,
  })
}
```
