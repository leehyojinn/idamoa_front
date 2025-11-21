# 자료실 (Document Board) API 문서

> Base URL: `/api/boards/document`

자료실 게시판 API입니다. 파일 업로드/다운로드, 필터 기능, 북마크, 유료 파일을 지원합니다.

---

## 목차

1. [게시글 생성](#1-게시글-생성)
2. [게시글 조회](#2-게시글-조회)
3. [게시글 수정](#3-게시글-수정)
4. [게시글 삭제](#4-게시글-삭제)
5. [게시글 검색](#5-게시글-검색)
6. [내가 작성한 게시글 목록](#6-내가-작성한-게시글-목록)
7. [북마크 토글](#7-북마크-토글)
8. [북마크 여부 확인](#8-북마크-여부-확인)

---

## 공통 Response 형식

모든 API는 `ApiResponse<T>` 래퍼로 응답합니다.

```json
{
  "success": true,
  "data": { ... },
  "errorCode": null,
  "message": null
}
```

**에러 응답:**
```json
{
  "success": false,
  "data": null,
  "errorCode": "ERROR_CODE",
  "message": "에러 메시지"
}
```

---

## 1. 게시글 생성

새로운 자료실 게시글을 생성합니다.

### Request

```
POST /api/boards/document
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### 파일 업로드 프로세스

1. `/api/files/presigned` 호출 → Presigned URL 획득
2. S3로 파일 직접 업로드 (PUT 요청)
3. `/api/files/complete` 호출 → 파일 UUID 획득
4. **이 API 호출** → 획득한 파일 UUID를 `fileUuids` 배열로 전송

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | String | ✅ | 제목 (최대 200자) |
| `content` | String | ✅ | 내용 (최대 5000자) |
| `fileUuids` | String[] | ✅ | 파일 UUID 배열 (최소 1개) |
| `categoryId` | Long | ❌ | 카테고리 ID |
| `thumbnailUuid` | String | ❌ | 썸네일 이미지 UUID |
| `isPaid` | Boolean | ❌ | 유료 파일 여부 (기본: false) |
| `price` | Integer | ❌ | 가격 (원) - 유료인 경우만 |
| `filterOptionIds` | Long[] | ❌ | 필터 옵션 ID 배열 |
| `tags` | String[] | ❌ | 태그 배열 |
| `isPublished` | Boolean | ❌ | 즉시 게시 여부 (기본: true) |
| `isPrivate` | Boolean | ❌ | 비공개 여부 (기본: false) |

### Request 예시

```json
{
  "title": "병원 인테리어 설계도면 공유",
  "content": "50평 규모 치과 인테리어 설계도면입니다. 대기실, 진료실, 상담실 포함되어 있습니다.",
  "fileUuids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "categoryId": 1,
  "thumbnailUuid": "550e8400-e29b-41d4-a716-446655440002",
  "isPaid": true,
  "price": 50000,
  "filterOptionIds": [1, 2, 3],
  "tags": ["치과", "50평", "모던"],
  "isPublished": true,
  "isPrivate": false
}
```

### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "병원 인테리어 설계도면 공유",
    "content": "50평 규모 치과 인테리어 설계도면입니다...",
    "boardType": "DOCUMENT",
    "categoryId": 1,
    "categoryName": "설계도면",
    "files": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "originalFilename": "floor_plan.dwg",
        "fileUrl": "https://s3.amazonaws.com/bucket/...",
        "fileSize": 2048576,
        "mimeType": "application/dwg",
        "fileExtension": "dwg"
      }
    ],
    "thumbnail": {
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "originalFilename": "preview.jpg",
      "fileUrl": "https://s3.amazonaws.com/bucket/...",
      "fileSize": 102400,
      "mimeType": "image/jpeg",
      "fileExtension": "jpg"
    },
    "isPaid": true,
    "price": 50000,
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "downloadCount": 0,
    "isPinned": false,
    "isFeatured": false,
    "isPublished": true,
    "publishedAt": "2025-01-15T10:30:00",
    "filterOptions": [
      {
        "id": 1,
        "uuid": "filter-uuid-1",
        "categoryCode": "FILE_TYPE",
        "categoryName": "파일 형식",
        "code": "DWG",
        "name": "AutoCAD 도면",
        "shortName": "DWG",
        "color": "#FF5733",
        "icon": "file-dwg"
      }
    ],
    "tags": ["치과", "50평", "모던"],
    "userId": 1,
    "userEmail": "user@example.com",
    "userName": "홍길동",
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00",
    "isBookmarked": false,
    "hasDownloaded": false
  },
  "errorCode": null,
  "message": null
}
```

---

## 2. 게시글 조회

특정 자료실 게시글을 조회합니다. 조회 시 조회수가 자동 증가합니다.

### Request

```
GET /api/boards/document/{uuid}
Authorization: Bearer {accessToken}  (선택)
```

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `uuid` | UUID | ✅ | 게시글 UUID |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "병원 인테리어 설계도면 공유",
    "content": "50평 규모 치과 인테리어 설계도면입니다...",
    "boardType": "DOCUMENT",
    "categoryId": 1,
    "categoryName": "설계도면",
    "files": [
      {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "originalFilename": "floor_plan.dwg",
        "fileUrl": "https://s3.amazonaws.com/bucket/...",
        "fileSize": 2048576,
        "mimeType": "application/dwg",
        "fileExtension": "dwg"
      }
    ],
    "thumbnail": {
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "originalFilename": "preview.jpg",
      "fileUrl": "https://s3.amazonaws.com/bucket/...",
      "fileSize": 102400,
      "mimeType": "image/jpeg",
      "fileExtension": "jpg"
    },
    "isPaid": true,
    "price": 50000,
    "viewCount": 150,
    "likeCount": 25,
    "commentCount": 8,
    "downloadCount": 42,
    "isPinned": false,
    "isFeatured": true,
    "isPublished": true,
    "publishedAt": "2025-01-15T10:30:00",
    "filterOptions": [...],
    "tags": ["치과", "50평", "모던"],
    "userId": 1,
    "userEmail": "user@example.com",
    "userName": "홍길동",
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00",
    "isBookmarked": true,
    "hasDownloaded": false
  },
  "errorCode": null,
  "message": null
}
```

### 권한
- 비로그인 사용자도 조회 가능
- 비공개 게시글은 작성자만 조회 가능
- 로그인한 경우 `isBookmarked`, `hasDownloaded` 값 포함

---

## 3. 게시글 수정

자료실 게시글을 수정합니다.

### Request

```
PUT /api/boards/document/{uuid}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `uuid` | UUID | ✅ | 게시글 UUID |

### Request Body

모든 필드는 선택적입니다. 전달된 필드만 수정됩니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `title` | String | 제목 (최대 200자) |
| `content` | String | 내용 (최대 5000자) |
| `categoryId` | Long | 카테고리 ID |
| `fileUuids` | String[] | 파일 UUID 배열 (최소 1개) |
| `thumbnailUuid` | String | 썸네일 이미지 UUID |
| `isPaid` | Boolean | 유료 파일 여부 |
| `price` | Integer | 가격 (원) |
| `filterOptionIds` | Long[] | 필터 옵션 ID 배열 |
| `tags` | String[] | 태그 배열 |

### Request 예시

```json
{
  "title": "병원 인테리어 설계도면 공유 (수정)",
  "content": "내용이 수정되었습니다.",
  "price": 40000
}
```

### Response (200 OK)

생성 API와 동일한 `DocumentResponse` 반환

### 권한
- 작성자 본인만 수정 가능
- 다른 사용자가 수정 시도 시 403 Forbidden

---

## 4. 게시글 삭제

자료실 게시글을 삭제합니다. (Soft Delete)

### Request

```
DELETE /api/boards/document/{uuid}
Authorization: Bearer {accessToken}
```

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `uuid` | UUID | ✅ | 게시글 UUID |

### Response (204 No Content)

```json
{
  "success": true,
  "data": null,
  "errorCode": null,
  "message": null
}
```

### 권한
- 작성자 본인만 삭제 가능
- 다른 사용자가 삭제 시도 시 403 Forbidden

### 참고
- Soft Delete 방식 (isDeleted=true 설정)
- 목록 조회 시 노출되지 않음
- S3 파일은 즉시 삭제되지 않음
- 유료 파일인 경우 기존 구매자는 계속 다운로드 가능

---

## 5. 게시글 검색

자료실 검색 및 목록 조회 통합 API입니다.

### Request

```
GET /api/boards/document/search
Authorization: Bearer {accessToken}  (선택)
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `keyword` | String | ❌ | - | 제목, 내용, 태그에서 검색 |
| `tags` | String[] | ❌ | - | 태그 필터 |
| `filterOptionIds` | Long[] | ❌ | - | 필터 옵션 ID 배열 |
| `onlyBookmarked` | Boolean | ❌ | false | 북마크한 게시글만 (로그인 필요) |
| `onlyMyPosts` | Boolean | ❌ | false | 내가 작성한 게시글만 (로그인 필요) |
| `page` | Integer | ❌ | 0 | 페이지 번호 (0부터 시작) |
| `size` | Integer | ❌ | 20 | 페이지당 항목 수 |
| `sort` | String | ❌ | publishedAt,DESC | 정렬 기준 |

### 정렬 옵션

- `publishedAt,DESC` - 최신순 (기본값)
- `viewCount,DESC` - 조회수 높은 순
- `downloadCount,DESC` - 다운로드 많은 순
- `createdAt,DESC` - 생성일 최신순

### Request 예시

```
GET /api/boards/document/search?keyword=치과&filterOptionIds=1,2&page=0&size=20&sort=publishedAt,DESC
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "병원 인테리어 설계도면 공유",
        "content": "50평 규모 치과 인테리어 설계도면입니다...",
        "boardType": "DOCUMENT",
        "categoryId": 1,
        "categoryName": "설계도면",
        "files": [...],
        "thumbnail": {...},
        "isPaid": true,
        "price": 50000,
        "viewCount": 150,
        "likeCount": 25,
        "commentCount": 8,
        "downloadCount": 42,
        "isPinned": false,
        "isFeatured": true,
        "isPublished": true,
        "publishedAt": "2025-01-15T10:30:00",
        "filterOptions": [...],
        "tags": ["치과", "50평", "모던"],
        "userId": 1,
        "userEmail": "user@example.com",
        "userName": "홍길동",
        "createdAt": "2025-01-15T10:30:00",
        "updatedAt": "2025-01-15T10:30:00",
        "isBookmarked": true,
        "hasDownloaded": false
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
      },
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 125,
    "totalPages": 7,
    "last": false,
    "size": 20,
    "number": 0,
    "sort": {
      "empty": false,
      "sorted": true,
      "unsorted": false
    },
    "numberOfElements": 20,
    "first": true,
    "empty": false
  },
  "errorCode": null,
  "message": null
}
```

### 복합 검색 예시

```
# 키워드 + 필터 옵션
GET /api/boards/document/search?keyword=치과&filterOptionIds=1,2

# 내가 작성한 글 중 키워드 검색
GET /api/boards/document/search?keyword=치과&onlyMyPosts=true

# 북마크한 글만 조회
GET /api/boards/document/search?onlyBookmarked=true
```

---

## 6. 내가 작성한 게시글 목록

로그인한 사용자가 작성한 자료실 게시글 목록을 조회합니다.

### Request

```
GET /api/boards/document/my
Authorization: Bearer {accessToken}
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `page` | Integer | ❌ | 0 | 페이지 번호 (0부터 시작) |
| `size` | Integer | ❌ | 20 | 페이지당 항목 수 |
| `sort` | String | ❌ | createdAt,DESC | 정렬 기준 |

### Response (200 OK)

검색 API와 동일한 페이지네이션 응답

### 권한
- 로그인 필수

### 활용
- 마이페이지 - 내가 올린 자료
- 자료 관리
- 게시글 수정/삭제 전 목록 확인

---

## 7. 북마크 토글

자료실 게시글 북마크를 추가하거나 제거합니다.

### Request

```
POST /api/boards/document/{uuid}/bookmark
Authorization: Bearer {accessToken}
```

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `uuid` | UUID | ✅ | 게시글 UUID |

### Response (200 OK)

```json
{
  "success": true,
  "data": true,
  "errorCode": null,
  "message": null
}
```

### Response 설명

| 값 | 설명 |
|----|------|
| `true` | 북마크 추가됨 |
| `false` | 북마크 제거됨 |

### 권한
- 로그인 필수

---

## 8. 북마크 여부 확인

사용자가 해당 게시글을 북마크했는지 확인합니다.

### Request

```
GET /api/boards/document/{uuid}/bookmark
Authorization: Bearer {accessToken}
```

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `uuid` | UUID | ✅ | 게시글 UUID |

### Response (200 OK)

```json
{
  "success": true,
  "data": true,
  "errorCode": null,
  "message": null
}
```

### Response 설명

| 값 | 설명 |
|----|------|
| `true` | 북마크 되어 있음 |
| `false` | 북마크 안 되어 있음 |

### 권한
- 로그인 필수

### 활용
- 게시글 상세 페이지에서 북마크 버튼 상태 표시
- UI에서 북마크 아이콘 활성화 여부 결정

---

## DTO 상세 정의

### DocumentResponse

| 필드 | 타입 | 설명 |
|------|------|------|
| `uuid` | UUID | 게시글 고유 식별자 |
| `title` | String | 제목 |
| `content` | String | 내용 |
| `boardType` | String | 게시판 타입 ("DOCUMENT") |
| `categoryId` | Long | 카테고리 ID |
| `categoryName` | String | 카테고리 이름 |
| `files` | FileInfo[] | 첨부 파일 목록 |
| `thumbnail` | FileInfo | 썸네일 파일 정보 |
| `isPaid` | Boolean | 유료 파일 여부 |
| `price` | Integer | 가격 (원) |
| `viewCount` | Integer | 조회수 |
| `likeCount` | Integer | 좋아요 수 |
| `commentCount` | Integer | 댓글 수 |
| `downloadCount` | Long | 다운로드 수 |
| `isPinned` | Boolean | 고정 여부 |
| `isFeatured` | Boolean | 추천 여부 |
| `isPublished` | Boolean | 게시 여부 |
| `publishedAt` | LocalDateTime | 게시 일시 |
| `filterOptions` | FilterOptionSummary[] | 필터 옵션 목록 |
| `tags` | String[] | 태그 배열 |
| `userId` | Long | 작성자 ID |
| `userEmail` | String | 작성자 이메일 |
| `userName` | String | 작성자 이름 |
| `createdAt` | LocalDateTime | 생성 일시 |
| `updatedAt` | LocalDateTime | 수정 일시 |
| `isBookmarked` | Boolean | 북마크 여부 (로그인 시) |
| `hasDownloaded` | Boolean | 다운로드 여부 (로그인 시) |

### FileInfo

| 필드 | 타입 | 설명 |
|------|------|------|
| `uuid` | UUID | 파일 고유 식별자 |
| `originalFilename` | String | 원본 파일명 |
| `fileUrl` | String | 파일 다운로드 URL |
| `fileSize` | Long | 파일 크기 (bytes) |
| `mimeType` | String | MIME 타입 |
| `fileExtension` | String | 파일 확장자 |

### FilterOptionSummary

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 필터 옵션 ID |
| `uuid` | UUID | 필터 옵션 UUID |
| `categoryCode` | String | 필터 카테고리 코드 |
| `categoryName` | String | 필터 카테고리 이름 |
| `code` | String | 필터 옵션 코드 |
| `name` | String | 필터 옵션 이름 |
| `shortName` | String | 필터 옵션 짧은 이름 |
| `color` | String | 색상 코드 |
| `icon` | String | 아이콘 |

---

## 에러 코드

| 에러 코드 | HTTP 상태 | 설명 |
|----------|-----------|------|
| `AUTHENTICATION_REQUIRED` | 401 | 로그인이 필요합니다 |
| `BOARD_NOT_FOUND` | 404 | 게시글을 찾을 수 없습니다 |
| `ACCESS_DENIED` | 403 | 접근 권한이 없습니다 |
| `INVALID_INPUT` | 400 | 잘못된 입력값입니다 |
