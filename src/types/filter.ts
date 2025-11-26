export type EntityType = 'COMPANY' | 'HOSPITAL' | 'SERVICE'
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
  metadata?: Record<string, any>
}

export interface FilterCategoryUpdateRequest {
  name?: string
  description?: string
  displayOrder?: number
  icon?: string
  isRequired?: boolean
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
  metadata?: Record<string, any>
}

export interface FilterOptionUpdateRequest {
  name?: string
  shortName?: string
  description?: string
  displayOrder?: number
  icon?: string
  color?: string
  metadata?: Record<string, any>
}
