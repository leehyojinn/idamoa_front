import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCommunityCategories,
  getCommunityTree,
  getCommunityCategory,
  getCommunityBySlug,
  type CommunityCategory,
} from '@/lib/api/community'
import {
  getAdminCommunityCategories,
  getAdminCommunityCategoryTree,
  getAdminCommunityCategory,
  createAdminCommunityCategory,
  updateAdminCommunityCategory,
  deleteAdminCommunityCategory,
  type AdminCommunityCategory,
  type AdminCommunityCategoryCreateRequest,
  type AdminCommunityCategoryUpdateRequest,
  type AdminCommunityCategorySearchParams,
} from '@/lib/api/admin-community'

// ========== Query Keys ==========

export const categoryKeys = {
  all: ['community-categories'] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  detail: (uuid: string) => [...categoryKeys.all, 'detail', uuid] as const,
  bySlug: (slug: string) => [...categoryKeys.all, 'slug', slug] as const,
  admin: {
    all: ['admin-community-categories'] as const,
    list: (params?: AdminCommunityCategorySearchParams) =>
      [...categoryKeys.admin.all, 'list', params] as const,
    tree: () => [...categoryKeys.admin.all, 'tree'] as const,
    detail: (uuid: string) => [...categoryKeys.admin.all, 'detail', uuid] as const,
  },
}

// ========== Public Hooks ==========

/**
 * 카테고리 트리 조회 훅 (활성화된 카테고리만)
 */
export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: async () => {
      const response = await getCommunityCategories()
      if (!response.success) {
        throw new Error(response.message || '카테고리 조회 실패')
      }
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 카테고리 상세 조회 훅
 */
export function useCategory(uuid: string) {
  return useQuery({
    queryKey: categoryKeys.detail(uuid),
    queryFn: async () => {
      const response = await getCommunityCategory(uuid)
      if (!response.success) {
        throw new Error(response.message || '카테고리 조회 실패')
      }
      return response.data
    },
    enabled: !!uuid,
  })
}

/**
 * 슬러그로 카테고리 조회 훅
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: categoryKeys.bySlug(slug),
    queryFn: async () => {
      const response = await getCommunityBySlug(slug)
      if (!response.success) {
        throw new Error(response.message || '카테고리 조회 실패')
      }
      return response.data
    },
    enabled: !!slug,
  })
}

// ========== Admin Hooks ==========

/**
 * 관리자 카테고리 목록 조회 훅 (플랫 리스트, 페이지네이션)
 */
export function useAdminCategories(params?: AdminCommunityCategorySearchParams) {
  return useQuery({
    queryKey: categoryKeys.admin.list(params),
    queryFn: async () => {
      const response = await getAdminCommunityCategories(params)
      if (!response.success) {
        throw new Error(response.message || '카테고리 목록 조회 실패')
      }
      return response.data
    },
  })
}

/**
 * 관리자 카테고리 트리 조회 훅 (비활성 포함)
 */
export function useAdminCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.admin.tree(),
    queryFn: async () => {
      const response = await getAdminCommunityCategoryTree()
      if (!response.success) {
        throw new Error(response.message || '카테고리 트리 조회 실패')
      }
      return response.data
    },
  })
}

/**
 * 관리자 카테고리 상세 조회 훅
 */
export function useAdminCategory(uuid: string) {
  return useQuery({
    queryKey: categoryKeys.admin.detail(uuid),
    queryFn: async () => {
      const response = await getAdminCommunityCategory(uuid)
      if (!response.success) {
        throw new Error(response.message || '카테고리 조회 실패')
      }
      return response.data
    },
    enabled: !!uuid,
  })
}

/**
 * 카테고리 생성 훅
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AdminCommunityCategoryCreateRequest) => {
      const response = await createAdminCommunityCategory(data)
      if (!response.success) {
        throw new Error(response.message || '카테고리 생성 실패')
      }
      return response.data
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.admin.all })
    },
  })
}

/**
 * 카테고리 수정 훅
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uuid,
      data,
    }: {
      uuid: string
      data: AdminCommunityCategoryUpdateRequest
    }) => {
      const response = await updateAdminCommunityCategory(uuid, data)
      if (!response.success) {
        throw new Error(response.message || '카테고리 수정 실패')
      }
      return response.data
    },
    onSuccess: (_, { uuid }) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.admin.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(uuid) })
      queryClient.invalidateQueries({ queryKey: categoryKeys.admin.detail(uuid) })
    },
  })
}

/**
 * 카테고리 삭제 훅
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await deleteAdminCommunityCategory(uuid)
      if (!response.success) {
        throw new Error(response.message || '카테고리 삭제 실패')
      }
      return null
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      queryClient.invalidateQueries({ queryKey: categoryKeys.admin.all })
    },
  })
}

// ========== Utility Functions ==========

/**
 * 트리를 플랫 리스트로 변환 (들여쓰기 레벨 유지)
 */
export function flattenCategories<T extends { children: T[] | null }>(
  categories: T[],
  level = 0
): Array<T & { level: number }> {
  const result: Array<T & { level: number }> = []

  for (const category of categories) {
    result.push({ ...category, level })

    if (category.children && category.children.length > 0) {
      result.push(...flattenCategories(category.children, level + 1))
    }
  }

  return result
}

/**
 * 부모 선택용 플랫 리스트 생성 (자기 자신 제외)
 */
export function flattenForParentSelect<T extends { uuid: string; name: string; children: T[] | null }>(
  categories: T[],
  excludeUuid?: string,
  level = 0
): Array<{ uuid: string; name: string; level: number }> {
  const result: Array<{ uuid: string; name: string; level: number }> = []

  for (const category of categories) {
    // 자기 자신과 하위 카테고리는 제외 (순환 참조 방지)
    if (category.uuid !== excludeUuid) {
      result.push({
        uuid: category.uuid,
        name: category.name,
        level,
      })

      if (category.children && category.children.length > 0) {
        result.push(...flattenForParentSelect(category.children, excludeUuid, level + 1))
      }
    }
  }

  return result
}

/**
 * UUID로 카테고리 찾기 (트리에서)
 */
export function findCategoryInTree<T extends { uuid: string; children: T[] | null }>(
  categories: T[],
  uuid: string
): T | null {
  for (const category of categories) {
    if (category.uuid === uuid) {
      return category
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryInTree(category.children, uuid)
      if (found) return found
    }
  }

  return null
}

/**
 * 슬러그로 카테고리 찾기 (트리에서)
 */
export function findCategoryBySlug<T extends { slug: string; children: T[] | null }>(
  categories: T[],
  slug: string
): T | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return category
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryBySlug(category.children, slug)
      if (found) return found
    }
  }

  return null
}
