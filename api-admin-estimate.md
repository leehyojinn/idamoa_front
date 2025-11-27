# 관리자 견적 요청/제안 관리 API 문서

## 📋 목차

1. [견적 요청 관리](#견적-요청-관리)
2. [견적 제안 관리](#견적-제안-관리)
3. [Next.js 연동 예시](#nextjs-연동-예시)

---

## 개요

견적 시스템은 고객의 견적 요청과 업체의 견적 제안을 관리하는 시스템입니다.

**⚠️ 중요: 견적 API는 Long ID를 사용합니다! (UUID 아님)**

### 견적 시스템 플로우

```
고객 → 견적 요청 생성 → 업체들이 견적 제안 제출 → 고객이 제안 선택 → 계약 진행
```

### 견적 요청 상태

- `DRAFT`: 작성 중
- `PUBLISHED`: 게시됨 (업체들이 볼 수 있음)
- `CANCELLED`: 취소됨
- `COMPLETED`: 완료됨 (제안 선택 완료)

---

## 견적 요청 관리

### 1. 견적 요청 목록 조회

**API:**
```
GET /api/admin/estimate-requests
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | String | ❌ | 상태 필터 (DRAFT, PUBLISHED, CANCELLED, COMPLETED) |
| `page` | Number | ❌ | 페이지 (기본: 0) |
| `size` | Number | ❌ | 크기 (기본: 20) |
| `sort` | String | ❌ | 정렬 (기본: createdAt,DESC) |

**특징:**
- 관리자는 모든 견적 요청 조회 가능 (삭제된 것 포함)
- 상태별 필터링 가능

**Request:**
```bash
GET /api/admin/estimate-requests?status=PUBLISHED&page=0&size=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 123,
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "title": "50평 치과 인테리어 견적 요청",
        "location": "서울특별시 강남구",
        "budgetMin": 50000000,
        "budgetMax": 70000000,
        "status": "PUBLISHED",
        "visibility": "PUBLIC",
        "proposalCount": 5,
        "viewCount": 48,
        "expiresAt": "2025-02-10T23:59:59",
        "createdAt": "2025-01-20T10:00:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "number": 0,
    "size": 20
  }
}
```

---

### 2. 견적 요청 상세 조회

**API:**
```
GET /api/admin/estimate-requests/{requestId}
```

**⚠️ 주의: requestId는 Long 타입 (숫자)입니다! UUID가 아닙니다!**

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `requestId` | Long | ✅ | 견적 요청 ID (숫자) |

**특징:**
- 관리자 조회는 조회수가 증가하지 않음
- 삭제된 견적도 조회 가능

**Request:**
```bash
GET /api/admin/estimate-requests/123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 456,
    "userEmail": "customer@example.com",
    "userName": "홍길동",
    "title": "50평 치과 인테리어 견적 요청",
    "description": "신규 개원하는 치과 인테리어입니다. 대기실, 진료실, 상담실 포함하여 전체 50평 규모입니다.",
    "category": "병원/의료",
    "requirements": {
      "spaceType": "치과",
      "totalArea": 50,
      "includeRooms": ["대기실", "진료실", "상담실", "X-ray실"],
      "preferredStyle": "모던",
      "specialRequests": "환자 동선 최적화 필수"
    },
    "tags": ["치과", "50평", "모던", "신규개원"],
    "requiredSkills": ["인테리어 설계", "의료시설 시공 경험"],
    "budgetMin": 50000000,
    "budgetMax": 70000000,
    "desiredStartDate": "2025-03-01",
    "desiredEndDate": "2025-04-30",
    "location": "서울특별시 강남구",
    "address": "서울특별시 강남구 테헤란로 123",
    "latitude": 37.5012,
    "longitude": 127.0396,
    "images": [
      {
        "uuid": "650e8400-e29b-41d4-a716-446655440001",
        "url": "https://cdn.example.com/images/site1.jpg",
        "description": "현장 사진 1",
        "displayOrder": 1
      }
    ],
    "status": "PUBLISHED",
    "isPublic": true,
    "proposalCount": 5,
    "viewCount": 48,
    "expiresAt": "2025-02-10T23:59:59",
    "createdAt": "2025-01-20T10:00:00",
    "updatedAt": "2025-01-20T10:30:00",
    "metadata": {
      "source": "web",
      "deviceType": "desktop"
    },
    "clientName": "홍길동 치과",
    "businessType": "개인사업자",
    "areaPyeong": 50.0,
    "contactName": "홍길동",
    "contactPhone": "010-1234-5678",
    "submissionDeadline": "2025-02-10T23:59:59",
    "attachments": [
      {
        "uuid": "750e8400-e29b-41d4-a716-446655440002",
        "originalFilename": "평면도.pdf",
        "fileUrl": "https://cdn.example.com/files/평면도.pdf",
        "fileSize": 2048576,
        "mimeType": "application/pdf"
      }
    ],
    "isDeleted": false,
    "deletedAt": null
  }
}
```

---

### 3. 견적 요청 삭제

**API:**
```
DELETE /api/admin/estimate-requests/{requestId}
```

**⚠️ 주의: requestId는 Long 타입 (숫자)입니다!**

**삭제 방식:**
- Soft Delete: `is_deleted` 플래그만 변경
- 실제 데이터는 삭제되지 않음
- 관리자는 모든 견적 요청 삭제 가능 (소유자 확인 없음)

**Request:**
```bash
DELETE /api/admin/estimate-requests/123
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": null
}
```

---

### 4. 견적 요청 상태 변경

**API:**
```
PATCH /api/admin/estimate-requests/{requestId}/status
```

**⚠️ 주의: requestId는 Long 타입 (숫자)입니다!**

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `status` | String | ✅ | 변경할 상태 (PUBLISHED, CANCELLED, COMPLETED) |

**상태 설명:**
- `PUBLISHED`: 게시 - 업체들이 견적 제안 가능
- `CANCELLED`: 취소 - 견적 요청 취소
- `COMPLETED`: 완료 - 견적 선택 완료

**Request:**
```bash
PATCH /api/admin/estimate-requests/123/status?status=PUBLISHED
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "50평 치과 인테리어 견적 요청",
    "status": "PUBLISHED",
    "updatedAt": "2025-01-26T11:00:00"
  }
}
```

---

## 견적 제안 관리

### 5. 견적 제안 목록 조회

**API:**
```
GET /api/admin/proposals
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | Number | ❌ | 페이지 (기본: 0) |
| `size` | Number | ❌ | 크기 (기본: 20) |
| `sort` | String | ❌ | 정렬 (기본: createdAt,DESC) |

**특징:**
- 관리자는 모든 업체의 견적 제안 조회 가능

**Request:**
```bash
GET /api/admin/proposals?page=0&size=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 789,
        "uuid": "850e8400-e29b-41d4-a716-446655440003",
        "title": "50평 치과 인테리어 견적 제안",
        "description": "저희 업체는 의료시설 인테리어 전문 업체로 20년 경력을 보유하고 있습니다...",
        "price": 60000000,
        "status": "SUBMITTED",
        "isSelected": false,
        "selectedAt": null,
        "validUntil": "2025-02-28",
        "attachments": [
          {
            "uuid": "950e8400-e29b-41d4-a716-446655440004",
            "originalFilename": "견적서.pdf",
            "fileUrl": "https://cdn.example.com/files/견적서.pdf",
            "fileSize": 1024000,
            "mimeType": "application/pdf"
          }
        ],
        "pricingDetails": {
          "design": 10000000,
          "construction": 40000000,
          "materials": 8000000,
          "others": 2000000
        },
        "timeline": {
          "design": "2주",
          "construction": "6주",
          "total": "8주"
        },
        "companyId": 234,
        "companyUuid": "a50e8400-e29b-41d4-a716-446655440005",
        "companyName": "다모아 인테리어",
        "requestId": 123,
        "requestUuid": "550e8400-e29b-41d4-a716-446655440000",
        "requestTitle": "50평 치과 인테리어 견적 요청",
        "createdAt": "2025-01-21T14:00:00",
        "updatedAt": "2025-01-21T14:30:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "number": 0,
    "size": 20
  }
}
```

---

### 6. 견적 제안 삭제

**API:**
```
DELETE /api/admin/proposals/{proposalId}
```

**⚠️ 주의: proposalId는 Long 타입 (숫자)입니다!**

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `proposalId` | Long | ✅ | 견적 제안 ID (숫자) |

**삭제 방식:**
- Soft Delete
- 관리자는 모든 견적 제안 삭제 가능

**Request:**
```bash
DELETE /api/admin/proposals/789
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": null
}
```

---

## Next.js 연동 예시

### TypeScript 타입 정의

```typescript
// types/estimate.ts

export interface EstimateRequestListItem {
  id: number;  // ← Long ID 사용!
  uuid: string;
  title: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  visibility: string;
  proposalCount: number;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface EstimateImageDto {
  uuid: string;
  url: string;
  description?: string;
  displayOrder: number;
}

export interface AttachmentResponse {
  uuid: string;
  originalFilename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface AdminEstimateRequest {
  id: number;  // ← Long ID 사용!
  uuid: string;
  userId: number;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  requirements: Record<string, any>;
  tags: string[];
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  desiredStartDate: string;
  desiredEndDate: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  images: EstimateImageDto[];
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isPublic: boolean;
  proposalCount: number;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
  clientName: string;
  businessType: string;
  areaPyeong: number;
  contactName: string;
  contactPhone: string;
  submissionDeadline: string;
  attachments: AttachmentResponse[];
  isDeleted: boolean;
  deletedAt?: string;
}

export interface ProposalResponse {
  id: number;  // ← Long ID 사용!
  uuid: string;
  title: string;
  description: string;
  price: number;
  status: string;
  isSelected: boolean;
  selectedAt?: string;
  validUntil: string;
  attachments: AttachmentResponse[];
  pricingDetails: Record<string, any>;
  timeline: Record<string, any>;
  companyId: number;
  companyUuid: string;
  companyName: string;
  requestId: number;
  requestUuid: string;
  requestTitle: string;
  createdAt: string;
  updatedAt: string;
}
```

### API 함수

```typescript
// lib/api/admin-estimate.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ========== 견적 요청 API ==========

export async function getEstimateRequests(params?: {
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page !== undefined) queryParams.append('page', String(params.page));
  if (params?.size !== undefined) queryParams.append('size', String(params.size));

  const response = await fetch(
    `${API_URL}/api/admin/estimate-requests?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 요청 목록 조회 실패');
  const result = await response.json();
  return result.data;
}

export async function getEstimateRequest(requestId: number) {
  const response = await fetch(
    `${API_URL}/api/admin/estimate-requests/${requestId}`,  // ← Long ID 사용!
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 요청 상세 조회 실패');
  const result = await response.json();
  return result.data;
}

export async function deleteEstimateRequest(requestId: number) {
  const response = await fetch(
    `${API_URL}/api/admin/estimate-requests/${requestId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 요청 삭제 실패');
}

export async function changeEstimateRequestStatus(
  requestId: number,
  status: 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
) {
  const response = await fetch(
    `${API_URL}/api/admin/estimate-requests/${requestId}/status?status=${status}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 요청 상태 변경 실패');
  const result = await response.json();
  return result.data;
}

// ========== 견적 제안 API ==========

export async function getProposals(params?: {
  page?: number;
  size?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', String(params.page));
  if (params?.size !== undefined) queryParams.append('size', String(params.size));

  const response = await fetch(
    `${API_URL}/api/admin/proposals?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 제안 목록 조회 실패');
  const result = await response.json();
  return result.data;
}

export async function deleteProposal(proposalId: number) {
  const response = await fetch(
    `${API_URL}/api/admin/proposals/${proposalId}`,  // ← Long ID 사용!
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) throw new Error('견적 제안 삭제 실패');
}
```

### React 컴포넌트 예시

```typescript
// components/admin/EstimateRequestList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getEstimateRequests, deleteEstimateRequest, changeEstimateRequestStatus } from '@/lib/api/admin-estimate';
import type { EstimateRequestListItem } from '@/types/estimate';

export function EstimateRequestList() {
  const [requests, setRequests] = useState<EstimateRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getEstimateRequests({
        status: statusFilter || undefined,
        page: 0,
        size: 20,
      });
      setRequests(data.content);
    } catch (error) {
      console.error('조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteEstimateRequest(requestId);  // ← Long ID 사용!
      alert('삭제되었습니다');
      fetchRequests();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleChangeStatus = async (
    requestId: number,
    status: 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  ) => {
    try {
      await changeEstimateRequestStatus(requestId, status);
      alert('상태가 변경되었습니다');
      fetchRequests();
    } catch (error) {
      alert('상태 변경 실패');
    }
  };

  return (
    <div>
      <h2>견적 요청 관리</h2>

      <div className="filter-box">
        <label>상태 필터:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">전체</option>
          <option value="DRAFT">작성중</option>
          <option value="PUBLISHED">게시됨</option>
          <option value="CANCELLED">취소됨</option>
          <option value="COMPLETED">완료됨</option>
        </select>
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>위치</th>
              <th>예산</th>
              <th>제안수</th>
              <th>조회수</th>
              <th>상태</th>
              <th>만료일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{request.title}</td>
                <td>{request.location}</td>
                <td>
                  {request.budgetMin.toLocaleString()} ~{' '}
                  {request.budgetMax.toLocaleString()}원
                </td>
                <td>{request.proposalCount}</td>
                <td>{request.viewCount}</td>
                <td>
                  <select
                    value={request.status}
                    onChange={(e) =>
                      handleChangeStatus(
                        request.id,
                        e.target.value as any
                      )
                    }
                  >
                    <option value="DRAFT">작성중</option>
                    <option value="PUBLISHED">게시됨</option>
                    <option value="CANCELLED">취소됨</option>
                    <option value="COMPLETED">완료됨</option>
                  </select>
                </td>
                <td>{new Date(request.expiresAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(request.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

```typescript
// components/admin/ProposalList.tsx
'use client';

import { useState, useEffect } from 'react';
import { getProposals, deleteProposal } from '@/lib/api/admin-estimate';
import type { ProposalResponse } from '@/types/estimate';

export function ProposalList() {
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await getProposals({
        page: 0,
        size: 20,
      });
      setProposals(data.content);
    } catch (error) {
      console.error('조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (proposalId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteProposal(proposalId);  // ← Long ID 사용!
      alert('삭제되었습니다');
      fetchProposals();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  return (
    <div>
      <h2>견적 제안 관리</h2>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>업체명</th>
              <th>견적 요청</th>
              <th>금액</th>
              <th>선택됨</th>
              <th>상태</th>
              <th>유효기간</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td>{proposal.id}</td>
                <td>{proposal.title}</td>
                <td>{proposal.companyName}</td>
                <td>{proposal.requestTitle}</td>
                <td>{proposal.price.toLocaleString()}원</td>
                <td>{proposal.isSelected ? '✓' : ''}</td>
                <td>{proposal.status}</td>
                <td>{new Date(proposal.validUntil).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(proposal.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 주요 차이점 정리

| 항목 | 견적 요청 API | 견적 제안 API |
|------|---------------|---------------|
| **ID 타입** | Long (숫자) | Long (숫자) |
| **엔드포인트** | `/api/admin/estimate-requests/...` | `/api/admin/proposals/...` |
| **목록 조회** | 상태 필터 가능 | 필터 없음 |
| **상태 변경** | ✅ 가능 (PUBLISHED, CANCELLED, COMPLETED) | ❌ 없음 |
| **삭제** | ✅ 가능 | ✅ 가능 |

---

## 견적 시스템 플로우 상세

### 1. 견적 요청 생성

```
고객 → DRAFT 상태로 견적 요청 작성 → 내용 작성 완료 → PUBLISHED로 변경
```

### 2. 견적 제안 제출

```
업체 → PUBLISHED 견적 요청 조회 → 견적 제안 작성 → 제출 (SUBMITTED 상태)
```

### 3. 견적 선택

```
고객 → 제출된 제안들 검토 → 원하는 제안 선택 → 견적 요청 COMPLETED로 변경
```

### 4. 관리자 개입

관리자는 언제든지:
- 부적절한 견적 요청 삭제 가능
- 부적절한 견적 제안 삭제 가능
- 견적 요청 상태 강제 변경 가능
- 모든 견적 요청/제안 조회 가능 (삭제된 것 포함)

---

## 상태 변경 가능 경로

```
DRAFT → PUBLISHED → COMPLETED
  ↓         ↓
CANCELLED  CANCELLED
```

**설명:**
- `DRAFT`: 작성 중 → `PUBLISHED` 또는 `CANCELLED`로 변경 가능
- `PUBLISHED`: 게시됨 → `COMPLETED` 또는 `CANCELLED`로 변경 가능
- `COMPLETED`: 완료됨 → 변경 불가 (최종 상태)
- `CANCELLED`: 취소됨 → 변경 불가 (최종 상태)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-01-26 | 초안 작성 (실제 구현 확인 후 작성) |

---

**문서 작성**: Claude Code
**최종 업데이트**: 2025-01-26
