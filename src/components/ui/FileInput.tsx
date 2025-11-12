'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloudUploadOutline, IoClose, IoDocumentTextOutline, IoImageOutline } from 'react-icons/io5';

interface FileInputProps {
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB 단위
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
}

export default function FileInput({
  onChange,
  accept,
  multiple = false,
  maxSize = 10,
  label,
  error,
  disabled = false,
  className = '',
  maxFiles = 5,
}: FileInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (fileList: FileList | null): File[] => {
    if (!fileList) return [];

    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024;

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSizeBytes) {
        setErrorMessage(`파일 크기는 ${maxSize}MB를 초과할 수 없습니다.`);
        return;
      }
      validFiles.push(file);
    });

    if (!multiple && validFiles.length > 1) {
      return [validFiles[0]];
    }

    if (validFiles.length + files.length > maxFiles) {
      setErrorMessage(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return files;
    }

    setErrorMessage('');
    return validFiles;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = validateFiles(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const newFiles = multiple ? [...files, ...droppedFiles] : droppedFiles;
      setFiles(newFiles);
      onChange(newFiles);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = validateFiles(e.target.files);
    if (selectedFiles.length > 0) {
      const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles;
      setFiles(newFiles);
      onChange(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange(newFiles);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <IoImageOutline className="text-2xl text-blue-500" />;
    }
    return <IoDocumentTextOutline className="text-2xl text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const displayError = error || errorMessage;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer
          ${disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
            : displayError
            ? 'border-red-300 bg-red-50 hover:border-red-400'
            : isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="flex flex-col items-center justify-center text-center"
        >
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <IoCloudUploadOutline
              className={`text-6xl mb-4 ${
                disabled ? 'text-gray-300' : isDragging ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </motion.div>

          <p className={`text-base font-medium mb-1 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {isDragging ? '파일을 놓아주세요' : '파일을 드래그하거나 클릭하세요'}
          </p>
          <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {multiple ? `최대 ${maxFiles}개, ` : ''}최대 {maxSize}MB
          </p>
        </motion.div>
      </div>

      {/* 파일 목록 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <IoClose className="text-xl" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {displayError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-500"
        >
          {displayError}
        </motion.p>
      )}
    </div>
  );
}
