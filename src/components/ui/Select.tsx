'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronDown } from 'react-icons/io5';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = '선택해주세요',
  label,
  error,
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-2.5 md:px-2.5 py-1.5 md:py-1.5 text-left rounded-lg md:rounded-lg border md:border transition-all duration-200
            flex items-center justify-between text-xs md:text-xs
            ${disabled
              ? 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200'
              : error
              ? 'border-red-300 bg-red-50 hover:border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : isOpen
              ? 'border-primary-500 bg-white shadow-lg ring-4 ring-primary-100'
              : 'border-gray-200 bg-white hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
            }
          `}
        >
          <span className={`flex items-center gap-1.5 md:gap-1.5 ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedOption?.color && (
              <span
                className="w-3 h-3 md:w-3 md:h-3 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IoChevronDown className={`text-sm md:text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 md:mt-1 bg-white border md:border border-gray-200 rounded-lg md:rounded-lg shadow-xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-2.5 md:px-2.5 py-2 md:py-1.5 text-left transition-all duration-150
                      flex items-center gap-1.5 md:gap-1.5 text-xs md:text-xs
                      ${option.value === value
                        ? 'bg-primary text-white hover:bg-primary-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    {option.color && (
                      <span
                        className="w-3 h-3 md:w-3 md:h-3 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
