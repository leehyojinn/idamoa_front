'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft, FiEdit, FiTrash2, FiBookmark, FiEye, FiTag, FiDownload, FiFile } from 'react-icons/fi'
import { getDocument, deleteDocument, toggleDocumentBookmark, type Document } from '@/lib/api/resource'
import { showErrorToast, showSuccessToast } from '@/lib/errorHandler'
import { useAuth } from '@/hooks/useAuth'
import { Dialog } from '@/components/ui/Dialog'

interface DocumentDetailClientProps {
  uuid: string
  initialData?: Document
}

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

export default function DocumentDetailClient({ uuid, initialData }: DocumentDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [document, setDocument] = useState<Document | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const getFileInfo = (extension: string) => {
    const ext = extension.toLowerCase()
    return FILE_ICONS[ext] || FILE_ICONS['default']
  }

  const fetchDocument = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDocument(uuid)
      if (result.success && result.data) {
        setDocument(result.data)
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        showErrorToast(error, '자료를 찾을 수 없습니다')
        router.push('/resources')
      } else {
        showErrorToast(error, '자료를 불러오는데 실패했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }, [uuid, router])

  useEffect(() => {
    // initialData가 있으면 fetch 건너뛰기 (SSR 데이터 사용)
    if (initialData) return
    fetchDocument()
  }, [fetchDocument, initialData])

  const handleDelete = async () => {
    if (!document) return

    setIsDeleting(true)
    try {
      await deleteDocument(document.uuid)
      showSuccessToast('자료가 삭제되었습니다')
      router.push('/resources')
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showErrorToast(error, '삭제 권한이 없습니다')
      } else {
        showErrorToast(error, '자료 삭제에 실패했습니다')
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggleBookmark = async () => {
    if (!document || !user) {
      showErrorToast(null, '로그인이 필요합니다')
      return
    }

    setIsBookmarking(true)
    try {
      const result = await toggleDocumentBookmark(document.uuid)
      if (result.success && result.data !== undefined) {
        const isBookmarked = result.data
        setDocument({
          ...document,
          isBookmarked: isBookmarked,
        })
        showSuccessToast(isBookmarked ? '북마크에 추가했습니다' : '북마크에서 제거했습니다')
      }
    } catch (error) {
      showErrorToast(error, '북마크 처리에 실패했습니다')
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleDownload = (fileUrl: string, filename: string) => {
    const link = window.document.createElement('a')
    link.href = fileUrl
    link.download = filename
    link.target = '_blank'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">자료를 불러오는 중...</p>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">자료를 찾을 수 없습니다.</p>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft />
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const isAuthor = user?.email === document.userEmail

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Link
            href="/resources"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
            목록으로
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={handleToggleBookmark}
                disabled={isBookmarking}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  document.isBookmarked
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiBookmark className={document.isBookmarked ? 'fill-current' : ''} />
                북마크
              </button>
            )}
            {isAuthor && (
              <>
                <Link
                  href={`/resources/${document.uuid}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FiEdit />
                  수정
                </Link>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FiTrash2 />
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* 자료 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {document.isPaid && (
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {document.price?.toLocaleString()}원
                </span>
              )}
              {document.categoryName && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {document.categoryName}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{document.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap">{document.content || ''}</p>
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <FiEye />
              {document.viewCount} 조회
            </div>
            <div className="flex items-center gap-1">
              <FiDownload />
              {document.downloadCount} 다운로드
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                {document.userName?.charAt(0) || 'U'}
              </div>
              <span>{document.userName || '알 수 없음'}</span>
            </div>
            <div className="text-gray-400">
              {new Date(document.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* 태그 */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {document.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  <FiTag className="text-xs" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 썸네일 이미지 */}
        {document.thumbnail && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">미리보기</h2>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-2xl">
              <Image
                src={document.thumbnail.fileUrl}
                alt="미리보기"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* 파일 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            첨부 파일 ({document.files.length})
          </h2>
          <div className="space-y-3">
            {document.files.map((file) => {
              const fileInfo = getFileInfo(file.fileExtension)
              return (
                <div
                  key={file.uuid}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: fileInfo.color }}
                    >
                      <FiFile className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.originalFilename}</p>
                      <p className="text-sm text-gray-500">
                        {fileInfo.label} • {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file.fileUrl, file.originalFilename)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <FiDownload />
                    다운로드
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">자료 삭제</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              정말로 이 자료를 삭제하시겠습니까?
              <br />
              삭제된 자료는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
