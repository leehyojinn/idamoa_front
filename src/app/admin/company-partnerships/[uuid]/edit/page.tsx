'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiArrowLeft, FiLoader, FiSave } from 'react-icons/fi'
import {
  useAdminCompanyPartnership,
  useAdminUpdateCompanyPartnership,
} from '@/hooks/usePartnership'
import AdminGuard from '@/components/auth/AdminGuard'
import toast from 'react-hot-toast'

const schema = z.object({
  startDate: z.string().min(1, '시작일을 입력해주세요'),
  endDate: z.string().min(1, '만료일을 입력해주세요'),
  displayOrder: z.number().min(0, '순서는 0 이상이어야 합니다').optional(),
  adminMemo: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true
}, {
  message: '만료일은 시작일보다 이후여야 합니다',
  path: ['endDate'],
})

type FormData = z.infer<typeof schema>

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default function AdminEditCompanyPartnershipPage({ params }: PageProps) {
  const { uuid } = use(params)
  const router = useRouter()

  const { data: partnership, isLoading } = useAdminCompanyPartnership(uuid)
  const { mutate, isPending } = useAdminUpdateCompanyPartnership()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (partnership) {
      reset({
        startDate: partnership.startDate,
        endDate: partnership.endDate,
        displayOrder: partnership.displayOrder,
        adminMemo: partnership.adminMemo || '',
      })
    }
  }, [partnership, reset])

  const onSubmit = (data: FormData) => {
    mutate(
      {
        uuid,
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          displayOrder: data.displayOrder,
          adminMemo: data.adminMemo,
        },
      },
      {
        onSuccess: () => {
          toast.success('제휴업체 정보가 수정되었습니다.')
          router.push(`/admin/company-partnerships/${uuid}`)
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || '제휴업체 수정에 실패했습니다.'
          toast.error(message)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      </AdminGuard>
    )
  }

  if (!partnership) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">제휴 정보를 불러올 수 없습니다.</p>
            <Link href="/admin/company-partnerships" className="text-blue-600 hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              뒤로가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">제휴업체 수정</h1>
            <p className="text-sm text-gray-600 mt-1">{partnership.companyName}</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* 업체 정보 (읽기 전용) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">업체명</label>
              <p className="text-gray-900 font-medium">{partnership.companyName}</p>
            </div>

            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            {/* 만료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                만료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>

            {/* 노출 순서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                노출 순서
              </label>
              <input
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                placeholder="0"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">낮을수록 먼저 노출됩니다.</p>
              {errors.displayOrder && (
                <p className="mt-1 text-sm text-red-500">{errors.displayOrder.message}</p>
              )}
            </div>

            {/* 관리자 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리자 메모
              </label>
              <textarea
                {...register('adminMemo')}
                rows={3}
                placeholder="관리자만 볼 수 있는 메모입니다."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5" />
                    수정
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  )
}
