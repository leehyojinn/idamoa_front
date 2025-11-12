'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmark } from 'react-icons/io5';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  error,
  className = '',
  size = 'md',
}: CheckboxProps) {
  const sizeClasses = {
    sm: {
      box: 'w-4 h-4',
      icon: 'text-xs',
      label: 'text-xs',
      description: 'text-xs',
    },
    md: {
      box: 'w-5 h-5',
      icon: 'text-sm',
      label: 'text-sm',
      description: 'text-xs',
    },
    lg: {
      box: 'w-5 h-5',
      icon: 'text-base',
      label: 'text-base',
      description: 'text-sm',
    },
  };

  const currentSize = sizeClasses[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`${className}`}>
      <label
        className={`
          group flex items-start gap-2.5 cursor-pointer select-none p-1.5 rounded-lg transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
          ${error ? 'bg-red-50/50' : ''}
        `}
        onClick={disabled ? undefined : handleClick}
      >
        {/* 체크박스 */}
        <div className="relative flex-shrink-0">
          <motion.div
            className={`
              ${currentSize.box}
              rounded-lg flex items-center justify-center relative overflow-hidden
              ${disabled
                ? 'bg-gray-100 border-2 border-gray-300'
                : error
                ? checked
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-200'
                  : 'border-2 border-red-300 bg-white'
                : checked
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200'
                : 'border-2 border-gray-300 bg-white group-hover:border-blue-400 group-hover:shadow-md'
              }
            `}
            whileTap={!disabled ? { scale: 0.92 } : {}}
            animate={{
              scale: checked ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.3,
            }}
          >
            {/* 체크 아이콘 */}
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                    opacity: 1
                  }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <IoCheckmark
                    className={`${currentSize.icon} text-white font-bold`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 배경 애니메이션 효과 */}
            {!disabled && checked && (
              <>
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ scale: 0, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </>
            )}
          </motion.div>

          {/* 호버 링 효과 */}
          {!disabled && !checked && (
            <div className={`
              absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
              ring-2 ring-blue-300 ring-offset-1
            `} />
          )}
        </div>

        {/* 레이블 및 설명 */}
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span
                className={`
                  ${currentSize.label}
                  font-medium block leading-tight
                  ${disabled ? 'text-gray-400' : error ? 'text-red-600' : 'text-gray-800'}
                  ${!disabled && 'group-hover:text-gray-900'}
                `}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className={`
                  ${currentSize.description}
                  block mt-0.5 leading-relaxed
                  ${disabled ? 'text-gray-300' : 'text-gray-500'}
                  ${!disabled && 'group-hover:text-gray-600'}
                `}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-600 ml-8 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
