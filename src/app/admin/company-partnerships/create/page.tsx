'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { FiArrowLeft, FiLoader, FiSave, FiSearch } from 'react-icons/fi'
import { useAdminCreateCompanyPartnership } from '@/hooks/usePartnership'
import { searchCompanies, type CompanyListItem } from '@/lib/api/company'
import AdminGuard from '@/components/auth/AdminGuard'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

const schema = z.object({
  companyUuid: z.string().min(1, '업체를 선택해주세요'),
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

export default function AdminCreateCompanyPartnershipPage() {
  const router = useRouter()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<CompanyListItem[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyListItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const { mutate, isPending } = useAdminCreateCompanyPartnership()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayOrder: 0,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    },
  })

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return

    setIsSearching(true)
    try {
      const response = await searchCompanies({ keyword: searchKeyword, size: 10 })
      if (response.success && response.data) {
        setSearchResults(response.data.content)
      }
    } catch (error) {
      console.error('업체 검색 실패:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCompany = (company: CompanyListItem) => {
    setSelectedCompany(company)
    setValue('companyUuid', company.uuid)
    setSearchResults([])
    setSearchKeyword('')
  }

  const onSubmit = (data: FormData) => {
    mutate(
      {
        companyUuid: data.companyUuid,
        startDate: data.startDate,
        endDate: data.endDate,
        displayOrder: data.displayOrder,
        adminMemo: data.adminMemo,
      },
      {
        onSuccess: () => {
          toast.success('제휴업체가 등록되었습니다.')
          router.push('/admin/company-partnerships')
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || '제휴업체 등록에 실패했습니다.'
          toast.error(message)
        },
      }
    )
  }

  return (
    <AdminGuard>
      <Navbar />
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
            <h1 className="text-2xl font-bold text-gray-900">제휴업체 등록</h1>
            <p className="text-sm text-gray-600 mt-1">새로운 제휴업체를 등록합니다.</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* 업체 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업체 선택 <span className="text-red-500">*</span>
              </label>

              {selectedCompany ? (
                <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-gray-900">{selectedCompany.name}</p>
                    <p className="text-sm text-gray-600">{selectedCompany.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompany(null)
                      setValue('companyUuid', '')
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                      placeholder="업체명을 검색하세요"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-colors"
                    >
                      {isSearching ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiSearch className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* 검색 결과 */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                      {searchResults.map((company) => (
                        <button
                          key={company.uuid}
                          type="button"
                          onClick={() => handleSelectCompany(company)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{company.name}</p>
                          <p className="text-sm text-gray-600">{company.address}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.companyUuid && (
                <p className="mt-1 text-sm text-red-500">{errors.companyUuid.message}</p>
              )}
            </div>

            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">낮을수록 먼저 노출됩니다. (기본값: 0)</p>
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5" />
                    등록
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </AdminGuard>
  )
}
