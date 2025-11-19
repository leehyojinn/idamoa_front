'use client'

import { FiDownload, FiFile, FiImage } from 'react-icons/fi'

export interface Attachment {
  id?: number
  fileUrl: string
  fileType: 'DRAWING' | 'PHOTO' | 'DOCUMENT' | 'ESTIMATE'
  fileDescription: string
  displayOrder: number
  originalFilename?: string
  mimeType?: string
  fileSize?: number
}

interface AttachmentListProps {
  attachments: Attachment[]
  title?: string
}

export default function AttachmentList({ attachments, title = '첨부파일' }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const isImage = (attachment: Attachment) => {
    return (
      attachment.fileType === 'PHOTO' ||
      attachment.mimeType?.startsWith('image/') ||
      attachment.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
  }

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.fileUrl
    link.download = attachment.originalFilename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const images = attachments.filter(isImage)
  const files = attachments.filter((att) => !isImage(att))

  return (
    <div className="space-y-6">
      {/* 이미지 미리보기 */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">이미지</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((attachment, index) => (
              <div
                key={attachment.id || index}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
              >
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileDescription || attachment.originalFilename || '첨부 이미지'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="bg-white rounded-full p-2 hover:bg-gray-100"
                  >
                    <FiDownload className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                {attachment.fileDescription && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">
                      {attachment.fileDescription}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{images.length > 0 ? '기타 파일' : title}</h3>
          <div className="space-y-2">
            {files.map((attachment, index) => (
              <div
                key={attachment.id || index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <FiFile className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.originalFilename || attachment.fileDescription}
                  </p>
                  {attachment.fileDescription && attachment.originalFilename !== attachment.fileDescription && (
                    <p className="text-xs text-gray-500 truncate">
                      {attachment.fileDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {attachment.fileType === 'DRAWING' && '도면'}
                      {attachment.fileType === 'DOCUMENT' && '문서'}
                      {attachment.fileType === 'ESTIMATE' && '견적서'}
                    </span>
                    {attachment.fileSize && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(attachment)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
