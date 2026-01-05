export interface FileInfo {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
  price?: number
  isPaid?: boolean
}

export interface FilterOptionSummary {
  id: number
  uuid: string
  categoryCode: string
  categoryName: string
  code: string
  name: string
  shortName: string
  color?: string
  icon?: string
}

export interface DocumentBoard {
  uuid: string
  title: string
  content: string
  boardType: 'DOCUMENT'
  categoryId?: number
  categoryName?: string

  // Document 특화 필드
  files: FileInfo[]
  thumbnail?: FileInfo
  isPaid: boolean
  price: number

  // 통계
  viewCount: number
  likeCount: number
  commentCount: number
  downloadCount: number

  // 상태
  isPinned: boolean
  isFeatured: boolean
  isPublished: boolean
  publishedAt?: string

  // 필터 및 태그
  filterOptions: FilterOptionSummary[]
  tags: string[]

  // 작성자
  userId: number
  userEmail: string
  userName: string

  // 시간
  createdAt: string
  updatedAt: string

  // 사용자 관련
  isBookmarked: boolean
  hasDownloaded: boolean
}

export interface DocumentCreateRequest {
  title: string
  content: string
  categoryId?: number
  fileUuids: string[]
  thumbnailUuid?: string
  isPaid?: boolean
  price?: number
  filterOptionIds?: number[]
  tags?: string[]
  isPublished?: boolean
  isPrivate?: boolean
}

export interface DocumentUpdateRequest {
  title?: string
  content?: string
  categoryId?: number
  fileUuids?: string[]
  thumbnailUuid?: string
  isPaid?: boolean
  price?: number
  filterOptionIds?: number[]
  tags?: string[]
}
