export interface FileInfo {
  uuid: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileExtension: string
}

export interface CopyrightInfo {
  owner: string
  license: string
  attribution: string
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

export interface GalleryBoard {
  uuid: string
  title: string
  content?: string
  boardType: 'GALLERY'
  categoryId?: number
  categoryName?: string

  // Gallery 특화 필드
  images: FileInfo[]
  relatedLink?: string
  copyright?: CopyrightInfo

  // 통계
  viewCount: number
  likeCount: number
  commentCount: number

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
}

export interface GalleryCreateRequest {
  title: string
  content?: string
  categoryId?: number
  imageUuids: string[] // 필수 (최소 1개)
  relatedLink?: string
  copyright?: {
    owner?: string
    license?: string
    attribution?: string
  }
  filterOptionIds?: number[]
  tags?: string[]
  isPublished?: boolean
  isPrivate?: boolean
}

export interface GalleryUpdateRequest {
  title?: string
  content?: string
  categoryId?: number
  imageUuids?: string[]
  relatedLink?: string
  copyright?: {
    owner?: string
    license?: string
    attribution?: string
  }
  filterOptionIds?: number[]
  tags?: string[]
}
