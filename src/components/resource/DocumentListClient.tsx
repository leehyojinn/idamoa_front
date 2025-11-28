'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiPlus, FiEye, FiBookmark, FiTag, FiFile, FiX, FiMoreVertical, FiEdit, FiTrash2, FiDownload, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi'
import { searchDocuments, deleteDocument, toggleDocumentBookmark, type DocumentListItem, type DocumentSearchParams, type DocumentSearchResponse } from '@/lib/api/resource'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import Select from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { getPublicFilters, type PublicFilterCategory } from '@/lib/api/filter'

// 파일 확장자별 아이콘/색상
const FILE_ICONS: { [key: string]: { color: string; label: string } } = {
  'pdf': { color: '#EF4444', label: 'PDF' },
  'doc': { color: '#3B82F6', label: 'DOC' },
  'docx': { color: '#3B82F6', label: 'DOCX' },
  'xls': { color: '#22C55E', label: 'XLS' },
  'xlsx': { color: '#22C55E', label: 'XLSX' },
  'ppt': { color: '#F97316', label: 'PPT' },
  'pptx': { color: '#F97316', label: 'PPTX' },
  'dwg': { color: '#8B5CF6', label: 'DWG' },
  'zip': { color: '#6B7280', label: 'ZIP' },
  'rar': { color: '#6B7280', label: 'RAR' },
  'default': { color: '#9CA3AF', label: 'FILE' }
}

// 파일 크기 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface DocumentListClientProps {
  initialData?: DocumentSearchResponse
}

export default function DocumentListClient({ initialData }: DocumentListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [documents, setDocuments] = useState<DocumentListItem[]>(initialData?.content || [])
  const [isLoading, setIsLoading] = useState(!initialData)

  // 메뉴 드롭다운 상태
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // 삭제 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState<DocumentListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 필터 펼침/접힘 상태
  const [showFilters, setShowFilters] = useState(false)

  // 필터 카테고리
  const [filterCategories, setFilterCategories] = useState<PublicFilterCategory[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  // 썸네일 URL 가져오기
  const getThumbnailUrl = (doc: DocumentListItem) => {
    if (doc.thumbnail?.fileUrl) return doc.thumbnail.fileUrl
    return ''
  }

  // 파일 확장자에 따른 스타일 정보
  const getFileInfo = (extension: string) => {
    const ext = extension.toLowerCase()
    return FILE_ICONS[ext] || FILE_ICONS['default']
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0)
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Search & Filter
  const [keyword, setKeyword] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'publishedAt' | 'viewCount' | 'downloadCount'>('publishedAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [onlyMyPosts, setOnlyMyPosts] = useState(false)

  // 필터 로드
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await getPublicFilters('DOCUMENT')
        setFilterCategories(filters)
      } catch (error) {
        showErrorToast(error, '필터 정보를 불러오는데 실패했습니다')
      } finally {
        setIsLoadingFilters(false)
      }
    }
    loadFilters()
  }, [])

  const handleSelectFilter = (categoryName: string, optionName: string) => {
    const category = filterCategories.find(c => c.name === categoryName)
    if (!category) return

    const option = category.options.find(o => o.name === optionName)
    if (!option) return

    if (!selectedFilterOptionIds.includes(option.id)) {
      const newFilterOptionIds = [...selectedFilterOptionIds, option.id]
      const newTags = [...selectedTags, optionName]
      setSelectedFilterOptionIds(newFilterOptionIds)
      setSelectedTags(newTags)
      updateURL({
        page: 0,
        keyword,
        filterOptionIds: newFilterOptionIds,
        tags: newTags,
        sortBy,
        sortDirection,
        onlyBookmarked,
        onlyMyPosts,
      })
    }
  }

  const handleRemoveTag = (tag: string) => {
    let optionIdToRemove: number | null = null
    for (const category of filterCategories) {
      const option = category.options.find(o => o.name === tag)
      if (option) {
        optionIdToRemove = option.id
        break
      }
    }

    const newTags = selectedTags.filter(t => t !== tag)
    const newFilterOptionIds = optionIdToRemove
      ? selectedFilterOptionIds.filter(id => id !== optionIdToRemove)
      : selectedFilterOptionIds

    setSelectedTags(newTags)
    setSelectedFilterOptionIds(newFilterOptionIds)
    updateURL({
      page: 0,
      keyword,
      filterOptionIds: newFilterOptionIds,
      tags: newTags,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleClearAllTags = () => {
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    updateURL({
      page: 0,
      keyword,
      filterOptionIds: [],
      tags: [],
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    })
  }

  const handleResetFilters = () => {
    setKeyword('')
    setSelectedTags([])
    setSelectedFilterOptionIds([])
    setSortBy('publishedAt')
    setSortDirection('DESC')
    setOnlyBookmarked(false)
    setOnlyMyPosts(false)
    router.push('/resources', { scroll: false })
  }

  const fetchDocuments = useCallback(async (params: DocumentSearchParams = {}) => {
    setIsLoading(true)
    try {
      const result = await searchDocuments({
        page: params.page || 0,
        size: 12,
        keyword: params.keyword || undefined,
        filterOptionIds: params.filterOptionIds || undefined,
        tags: params.tags,
        sortBy: params.sortBy || sortBy,
        sortDirection: params.sortDirection || sortDirection,
        onlyBookmarked: params.onlyBookmarked,
        onlyMyPosts: params.onlyMyPosts,
      })

      if (result.success && result.data) {
        setDocuments(result.data.content || [])
        setTotalPages(result.data.totalPages || 0)
        setTotalElements(result.data.totalElements || 0)
      } else {
        setDocuments([])
        setTotalPages(0)
        setTotalElements(0)
      }
    } catch (error) {
      showErrorToast(error, '자료 목록을 불러오는데 실패했습니다')
      setDocuments([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, sortDirection])

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '0')
    const keyword = searchParams.get('keyword') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const filterOptionIdsStr = searchParams.get('filterOptionIds')?.split(',').filter(Boolean) || []
    const filterOptionIds = filterOptionIdsStr.map(id => parseInt(id))
    const sortBy = (searchParams.get('sortBy') || 'publishedAt') as 'publishedAt' | 'viewCount' | 'downloadCount'
    const sortDirection = (searchParams.get('sortDirection') || 'DESC') as 'ASC' | 'DESC'
    const onlyBookmarked = searchParams.get('onlyBookmarked') === 'true'
    const onlyMyPosts = searchParams.get('onlyMyPosts') === 'true'

    setCurrentPage(page)
    setKeyword(keyword)
    setSelectedTags(tags)
    setSelectedFilterOptionIds(filterOptionIds)
    setSortBy(sortBy)
    setSortDirection(sortDirection)
    setOnlyBookmarked(onlyBookmarked)
    setOnlyMyPosts(onlyMyPosts)

    // 초기 로드 시 SSR 데이터 사용, URL 파라미터 변경 시에만 fetch
    const hasUrlParams = searchParams.toString() !== ''
    if (isInitialLoad && initialData && !hasUrlParams) {
      setIsInitialLoad(false)
      return
    }
    setIsInitialLoad(false)
    fetchDocuments({ page, keyword, tags, filterOptionIds, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
  }, [searchParams, fetchDocuments, isInitialLoad, initialData])

  const updateURL = (params: DocumentSearchParams) => {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', params.page.toString())
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.tags && params.tags.length > 0) query.set('tags', params.tags.join(','))
    if (params.filterOptionIds && params.filterOptionIds.length > 0) query.set('filterOptionIds', params.filterOptionIds.join(','))
    if (params.sortBy) query.set('sortBy', params.sortBy)
    if (params.sortDirection) query.set('sortDirection', params.sortDirection)
    if (params.onlyBookmarked) query.set('onlyBookmarked', 'true')
    if (params.onlyMyPosts) query.set('onlyMyPosts', 'true')

    router.push(`/resources?${query.toString()}`, { scroll: false })
  }

  const handleSearch = () => {
    const params = {
      page: 0,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = {
      page: newPage,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy,
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handleSortChange = (newSortBy: string) => {
    const params = {
      page: 0,
      keyword,
      tags: selectedTags,
      filterOptionIds: selectedFilterOptionIds,
      sortBy: newSortBy as 'publishedAt' | 'viewCount' | 'downloadCount',
      sortDirection,
      onlyBookmarked,
      onlyMyPosts,
    }
    updateURL(params)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleDeleteClick = (doc: DocumentListItem) => {
    setDeletingDocument(doc)
    setShowDeleteDialog(true)
    setOpenMenuId(null)
  }

  const handleDelete = async () => {
    if (!deletingDocument) return

    setIsDeleting(true)
    try {
      await deleteDocument(deletingDocument.uuid)
      showSuccessToast('자료가 삭제되었습니다')
      setShowDeleteDialog(false)
      setDeletingDocument(null)
      fetchDocuments({ page: currentPage, keyword, tags: selectedTags, filterOptionIds: selectedFilterOptionIds, sortBy, sortDirection, onlyBookmarked, onlyMyPosts })
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showErrorToast(error, '삭제 권한이 없습니다')
      } else {
        showErrorToast(error, '자료 삭제에 실패했습니다')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleBookmark = async (uuid: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    try {
      const result = await toggleDocumentBookmark(uuid)
      if (result.success && result.data !== undefined) {
        const isBookmarked = result.data

        setDocuments(documents.map(d =>
          d.uuid === uuid
            ? { ...d, isBookmarked: isBookmarked }
            : d
        ))
        showSuccessToast(isBookmarked ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    }
  }

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">자료실</h1>
          <p className="text-gray-600 mt-2">
            {totalElements}개의 자료
          </p>
        </div>
        {user && (
          <Link
            href="/resources/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <FiPlus className="text-xl" />
            자료 등록
          </Link>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-4">
        {/* 검색바 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="제목, 내용, 태그 등 검색..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            검색
          </button>
        </div>

        {/* 정렬 및 필터 */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                label=""
                options={[
                  { value: 'publishedAt', label: '최신순' },
                  { value: 'viewCount', label: '조회순' },
                  { value: 'downloadCount', label: '다운로드순' },
                ]}
                value={sortBy}
                onChange={handleSortChange}
              />
            </div>

            <div className="hidden sm:flex items-center gap-3 ml-auto">
              <button
                onClick={handleResetFilters}
                disabled={!keyword && selectedTags.length === 0 && sortBy === 'publishedAt' && !onlyBookmarked && !onlyMyPosts}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <FiRefreshCw />
                초기화
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter />
                상세 필터
                {selectedTags.length > 0 && (
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {selectedTags.length}
                  </span>
                )}
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>

          {/* 빠른 필터 (로그인 시) */}
          <div className="flex flex-wrap items-center gap-2">
            {user && (
              <>
                <button
                  onClick={() => {
                    const newValue = !onlyBookmarked
                    setOnlyBookmarked(newValue)
                    updateURL({
                      page: 0,
                      keyword,
                      tags: selectedTags,
                      filterOptionIds: selectedFilterOptionIds,
                      sortBy,
                      sortDirection,
                      onlyBookmarked: newValue,
                      onlyMyPosts,
                    })
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    onlyBookmarked
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FiBookmark className={onlyBookmarked ? 'fill-current' : ''} />
                  <span className="whitespace-nowrap">북마크만</span>
                </button>
                <button
                  onClick={() => {
                    const newValue = !onlyMyPosts
                    setOnlyMyPosts(newValue)
                    updateURL({
                      page: 0,
                      keyword,
                      tags: selectedTags,
                      filterOptionIds: selectedFilterOptionIds,
                      sortBy,
                      sortDirection,
                      onlyBookmarked,
                      onlyMyPosts: newValue,
                    })
                  }}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                    onlyMyPosts
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <FiEdit />
                  <span className="whitespace-nowrap">내 글만</span>
                </button>
              </>
            )}

            {/* 모바일: 초기화/상세필터 버튼 */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <button
                onClick={handleResetFilters}
                disabled={!keyword && selectedTags.length === 0 && sortBy === 'publishedAt' && !onlyBookmarked && !onlyMyPosts}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw />
                <span className="whitespace-nowrap">초기화</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter />
                <span className="whitespace-nowrap">필터</span>
                {selectedTags.length > 0 && (
                  <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 선택된 태그 미리보기 */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <FiTag />
              선택된 태그:
            </span>
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-white text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm border border-blue-200"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-blue-900 transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearAllTags}
              className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium"
            >
              모두 지우기
            </button>
          </div>
        )}

        {/* 상세 필터 (아코디언) */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiFilter className="text-blue-600" />
                필터 선택
              </h3>
            </div>

            {isLoadingFilters ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-2 text-gray-600">필터 로딩 중...</p>
              </div>
            ) : filterCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filterCategories.map((category) => (
                  <Select
                    key={category.id}
                    label={category.name}
                    options={[
                      { value: '', label: `${category.name} 선택` },
                      ...category.options.map(option => ({
                        value: option.name,
                        label: option.name,
                      }))
                    ]}
                    value=""
                    onChange={(value) => {
                      if (value) {
                        handleSelectFilter(category.name, value)
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                사용 가능한 필터가 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {/* 자료 그리드 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">자료를 불러오는 중...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">등록된 자료가 없습니다.</p>
          {user && (
            <Link
              href="/resources/create"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <FiPlus className="text-xl" />
              첫 자료 등록하기
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const isAuthor = user?.email === doc.userEmail
              const mainFile = doc.files?.[0]
              const fileInfo = mainFile ? getFileInfo(mainFile.fileExtension) : null

              return (
                <div key={doc.uuid} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow relative">
                  {/* 메뉴 버튼 (작성자만) */}
                  {isAuthor && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === doc.uuid ? null : doc.uuid)
                        }}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all"
                      >
                        <FiMoreVertical className="w-5 h-5 text-gray-700" />
                      </button>

                      {/* 드롭다운 메뉴 */}
                      {openMenuId === doc.uuid && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                          <Link
                            href={`/resources/${doc.uuid}/edit`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                            }}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span className="text-sm font-medium">수정</span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteClick(doc)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">삭제</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/resources/${doc.uuid}`}>
                    {/* 썸네일 / 파일 아이콘 */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {getThumbnailUrl(doc) ? (
                        <Image
                          src={getThumbnailUrl(doc)}
                          alt={doc.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                          <FiFile className="w-16 h-16 mb-2" />
                          {fileInfo && (
                            <span
                              className="px-3 py-1 rounded text-sm font-bold text-white"
                              style={{ backgroundColor: fileInfo.color }}
                            >
                              {fileInfo.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 상단 좌측 뱃지들 */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {/* 고정 표시 */}
                        {doc.isPinned && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold flex items-center gap-1">
                            📌 고정
                          </div>
                        )}
                        {/* 추천 표시 */}
                        {doc.isFeatured && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded text-sm font-bold flex items-center gap-1">
                            ⭐ 추천
                          </div>
                        )}
                        {/* 유료 표시 */}
                        {doc.isPaid && (
                          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-sm font-bold">
                            {doc.price?.toLocaleString()}원
                          </div>
                        )}
                      </div>

                      {/* 파일 개수 */}
                      {doc.files && doc.files.length > 1 && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                          파일 {doc.files.length}개
                        </div>
                      )}

                      {/* 북마크 버튼 */}
                      {user && (
                        <button
                          onClick={(e) => handleToggleBookmark(doc.uuid, e)}
                          className={`absolute bottom-2 right-2 p-2 rounded-full shadow-md transition-all ${
                            doc.isBookmarked
                              ? 'bg-yellow-100 bg-opacity-90 hover:bg-opacity-100'
                              : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                          }`}
                        >
                          <FiBookmark className={`w-5 h-5 ${doc.isBookmarked ? 'fill-current text-yellow-600' : 'text-gray-600'}`} />
                        </button>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {doc.content || ''}
                      </p>

                      {/* 파일 정보 */}
                      {mainFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FiFile className="w-4 h-4" />
                          <span className="truncate">{mainFile.originalFilename}</span>
                          <span className="text-gray-400">({formatFileSize(mainFile.fileSize)})</span>
                        </div>
                      )}

                      {/* 태그 */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                            >
                              <FiTag className="text-xs" />
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{doc.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                            {doc.userName?.charAt(0) || 'U'}
                          </div>
                          <span>{doc.userName || '알 수 없음'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiEye />
                            {doc.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiDownload />
                            {doc.downloadCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages >= 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 10) {
                    pageNum = i
                  } else if (currentPage < 5) {
                    pageNum = i
                  } else if (currentPage > totalPages - 6) {
                    pageNum = totalPages - 10 + i
                  } else {
                    pageNum = currentPage - 5 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteDialog(false)
              setDeletingDocument(null)
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">자료 삭제</h3>
            <div className="space-y-4">
              <p className="text-gray-600">
                정말로 이 자료를 삭제하시겠습니까?
                <br />
                삭제된 자료는 복구할 수 없습니다.
              </p>
              {deletingDocument && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{deletingDocument.title}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setDeletingDocument(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
