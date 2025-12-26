'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreatePartnershipInquiry } from '@/hooks/usePartnership'
import { PARTNERSHIP_TYPE_LABELS, type PartnershipType } from '@/types/partnership'
import { FiCheck, FiLoader, FiSend } from 'react-icons/fi'

const schema = z.object({
  partnershipType: z.enum(['PARTNERSHIP', 'ADVERTISEMENT', 'OTHER']),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z
    .string()
    .regex(/^\d{2,3}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
  content: z
    .string()
    .min(10, '문의 내용은 10자 이상이어야 합니다')
    .max(5000, '문의 내용은 5000자 이하여야 합니다'),
})

type FormData = z.infer<typeof schema>

export default function PartnershipInquiryForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { mutate, isPending } = useCreatePartnershipInquiry()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      partnershipType: 'PARTNERSHIP',
    },
  })

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true)
        reset()
      },
      onError: (error) => {
        alert('문의 등록에 실패했습니다. 다시 시도해주세요.')
        console.error(error)
      },
    })
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <FiCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">문의가 접수되었습니다</h3>
        <p className="text-green-700 mb-4">빠른 시일 내에 담당자가 연락드리겠습니다.</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-green-600 underline hover:text-green-800 transition-colors"
        >
          새 문의 작성하기
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 문의 유형 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          문의 유형 <span className="text-red-500">*</span>
        </label>
        <select
          {...register('partnershipType')}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {(Object.keys(PARTNERSHIP_TYPE_LABELS) as PartnershipType[]).map((type) => (
            <option key={type} value={type}>
              {PARTNERSHIP_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {errors.partnershipType && (
          <p className="mt-1 text-sm text-red-500">{errors.partnershipType.message}</p>
        )}
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="홍길동"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* 이메일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="contact@example.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      {/* 연락처 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone')}
          type="tel"
          placeholder="010-1234-5678"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      {/* 문의 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          문의 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('content')}
          rows={6}
          placeholder="문의 내용을 상세히 작성해주세요."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
        {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white font-medium py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            제출 중...
          </>
        ) : (
          <>
            <FiSend className="w-5 h-5" />
            문의하기
          </>
        )}
      </button>
    </form>
  )
}
