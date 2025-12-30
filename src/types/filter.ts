export type EntityType = 'COMPANY' | 'HOSPITAL' | 'SERVICE' | 'GALLERY' | 'PORTFOLIO' | 'DOCUMENT'
export type FilterType = 'SINGLE_SELECT' | 'MULTI_SELECT' | 'HIERARCHICAL'

export interface FilterCategory {
  id: number
  code: string
  name: string
  description?: string
  entityType: EntityType
  filterType: FilterType
  supportsHierarchy: boolean
  maxDepth: number
  displayOrder: number
  icon?: string
  isActive: boolean
  isRequired: boolean
  isExpanded?: boolean  // 카테고리 기본 펼침 상태
  metadata?: Record<string, any>
  options?: FilterOption[]
  createdAt: string
  updatedAt: string
}

export interface FilterOption {
  id: number
  categoryId: number
  categoryCode?: string
  categoryName?: string
  code: string
  name: string
  shortName?: string
  description?: string
  parentId?: number
  depth: number
  path: string
  displayOrder: number
  icon?: string
  color?: string
  isActive: boolean
  isDefault: boolean
  isExpanded?: boolean  // 계층 구조에서 자식 옵션 기본 펼침 상태
  usageCount: number
  metadata?: Record<string, any>
  children?: FilterOption[]
  createdAt: string
  updatedAt: string
}

export interface FilterCategoryCreateRequest {
  code: string
  name: string
  description?: string
  entityType: EntityType
  filterType: FilterType
  supportsHierarchy?: boolean
  maxDepth?: number
  displayOrder?: number
  icon?: string
  isRequired?: boolean
  isExpanded?: boolean
  metadata?: Record<string, any>
}

export interface FilterCategoryUpdateRequest {
  name?: string
  description?: string
  displayOrder?: number
  icon?: string
  isRequired?: boolean
  isExpanded?: boolean
  metadata?: Record<string, any>
}

export interface FilterOptionCreateRequest {
  code: string
  name: string
  shortName?: string
  description?: string
  parentId?: number
  displayOrder?: number
  icon?: string
  color?: string
  isDefault?: boolean
  isExpanded?: boolean
  metadata?: Record<string, any>
}

export interface FilterOptionUpdateRequest {
  name?: string
  shortName?: string
  description?: string
  displayOrder?: number
  icon?: string
  color?: string
  isExpanded?: boolean
  metadata?: Record<string, any>
}
