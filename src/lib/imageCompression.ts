import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1, // 최대 1MB로 압축
  maxWidthOrHeight: 1920, // 최대 1920px
  useWebWorker: true, // 웹워커 사용으로 UI 블로킹 방지
}

/**
 * 이미지 파일을 압축합니다.
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // 이미지가 아니면 그대로 반환
  if (!file.type.startsWith('image/')) {
    return file
  }

  // GIF는 압축하지 않음 (애니메이션 손실 방지)
  if (file.type === 'image/gif') {
    return file
  }

  // 이미 작은 파일은 압축하지 않음 (500KB 이하)
  if (file.size <= 500 * 1024) {
    return file
  }

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  }

  try {
    const compressedFile = await imageCompression(file, compressionOptions)

    // 압축된 파일이 원본보다 크면 원본 반환
    if (compressedFile.size >= file.size) {
      return file
    }

    console.log(`이미지 압축: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

    return compressedFile
  } catch (error) {
    console.error('이미지 압축 실패:', error)
    return file // 압축 실패 시 원본 반환
  }
}

/**
 * 여러 이미지 파일을 압축합니다.
 * @param files 원본 이미지 파일 배열
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일 배열
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)))
}
