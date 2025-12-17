# GitHub Actions 배포 설정 가이드

## 개요

이 프로젝트는 GitHub Actions를 통해 자동 배포됩니다.
- **develop 브랜치** → Dev 환경 배포
- **master 브랜치** (PR merge) → Production 환경 배포

## 환경변수 (빌드 시 필요)

Next.js의 `NEXT_PUBLIC_*` 환경변수는 **빌드 시점에 번들에 포함**됩니다.
따라서 GitHub Secrets에 등록하여 빌드 시 주입해야 합니다.

| 환경변수 | 설명 | 예시 |
|----------|------|------|
| `NEXT_PUBLIC_SITE_URL` | API 서버 URL | `https://api.i-damoa.com` |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 앱 키 | `your-kakao-app-key` |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 클라이언트 키 | `your-toss-client-key` |

## GitHub Secrets 설정 가이드

### 1. GitHub Repository 설정 페이지 접속

```
Repository → Settings → Secrets and variables → Actions
```

### 2. 등록해야 할 Secrets

#### 서버 접속 정보

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `DEV_EC2_HOST` | Dev EC2 IP 또는 도메인 | `1.2.3.4` |
| `DEV_EC2_SSH_KEY` | Dev EC2 SSH 개인키 (PEM 내용 전체) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `PROD_EC2_HOST` | Prod EC2 IP 또는 도메인 | `5.6.7.8` |
| `PROD_EC2_SSH_KEY` | Prod EC2 SSH 개인키 (PEM 내용 전체) | `-----BEGIN RSA PRIVATE KEY-----...` |

#### 환경변수 (Dev)

| Secret Name | 설명 |
|-------------|------|
| `DEV_NEXT_PUBLIC_SITE_URL` | Dev API URL (예: `https://dev-api.i-damoa.com`) |
| `DEV_NEXT_PUBLIC_KAKAO_APP_KEY` | Dev 카카오 앱 키 |
| `DEV_NEXT_PUBLIC_TOSS_CLIENT_KEY` | Dev 토스 클라이언트 키 |

#### 환경변수 (Production)

| Secret Name | 설명 |
|-------------|------|
| `PROD_NEXT_PUBLIC_SITE_URL` | Prod API URL (예: `https://api.i-damoa.com`) |
| `PROD_NEXT_PUBLIC_KAKAO_APP_KEY` | Prod 카카오 앱 키 |
| `PROD_NEXT_PUBLIC_TOSS_CLIENT_KEY` | Prod 토스 클라이언트 키 |

#### 알림 (선택사항)

| Secret Name | 설명 |
|-------------|------|
| `SLACK_WEBHOOK_URL` | Slack 알림 웹훅 URL |

### 3. SSH Key 등록 방법

1. EC2 인스턴스의 PEM 키 파일 내용을 복사
2. GitHub Secrets에 `EC2_SSH_KEY`로 등록
3. 전체 내용을 포함해야 함 (`-----BEGIN RSA PRIVATE KEY-----`부터 `-----END RSA PRIVATE KEY-----`까지)

```bash
# PEM 파일 내용 확인
cat ~/.ssh/your-key.pem
```

## 배포 프로세스

### 기존 방식 (EC2에서 빌드) - 문제점
```
GitHub → EC2에 소스 복사 → EC2에서 Docker 빌드 → 실행
                              ↑
                         메모리 부족 (t3.small 2GB)
```

### 새로운 방식 (GitHub Actions에서 빌드)
```
GitHub Actions에서 Docker 빌드 → ghcr.io에 푸시 → EC2에서 pull → 실행
         ↑
    충분한 메모리 (7GB+)
```

## 브랜치 전략

```
feature/* → develop (Dev 배포) → master (Production 배포)
               ↓                      ↓
          자동 배포              PR merge 시 배포
```

## 트러블슈팅

### 빌드 실패 시
1. GitHub Actions 로그 확인
2. Secrets 값이 올바르게 설정되었는지 확인
3. Docker 이미지 빌드 로그 확인

### 배포 실패 시
1. EC2 SSH 접속 가능 여부 확인
2. EC2 디스크 용량 확인 (`df -h`)
3. Docker 네트워크 확인 (`docker network ls`)

### 환경변수가 적용되지 않을 때
1. GitHub Secrets 값 확인
2. 워크플로우 파일에서 build-args 확인
3. Dockerfile의 ARG/ENV 설정 확인
