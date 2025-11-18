'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IoDocumentTextOutline } from 'react-icons/io5'
import ProposalEditForm from './ProposalEditForm'
import { getProposal, type Proposal } from '@/lib/api/proposal'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useMyCompany } from '@/hooks/useCompany'

interface ProposalEditClientWrapperProps {
  uuid: string
}

export default function ProposalEditClientWrapper({ uuid }: ProposalEditClientWrapperProps) {
  const router = useRouter()
  const { data: profileResponse } = useProfile()
  const { data: myCompanyResponse } = useMyCompany(profileResponse?.data?.profileType === 'COMPANY')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const proposalResult = await getProposal(uuid)
        if (proposalResult.success && proposalResult.data) {
          setProposal(proposalResult.data)
        } else {
          setError(true)
        }
      } catch (error: any) {
        console.error('Failed to fetch proposal:', error)

        if (error?.response?.status === 403) {
          showErrorToast(error, '이 제안서를 수정할 권한이 없습니다')
        } else {
          showErrorToast(error, '제안서를 불러오는데 실패했습니다')
        }
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [uuid])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">제안서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !proposal) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-xl text-gray-500 mb-4">제안서를 찾을 수 없습니다</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          뒤로 가기
        </button>
      </div>
    )
  }

  // 권한 체크
  const profile = profileResponse?.data
  const myCompany = myCompanyResponse?.data

  // 제안서 작성자(업체) 확인
  const isCompanyOwner = !!(
    profile &&
    profile.profileType === 'COMPANY' &&
    myCompany &&
    myCompany.id === proposal.companyId
  )

  // 수정 가능한 상태 확인
  const canEdit = isCompanyOwner && (proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED')

  // 권한 없음
  if (!canEdit) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <IoDocumentTextOutline className="text-6xl text-red-300 mx-auto mb-4" />
        <p className="text-xl text-gray-500 mb-4">이 제안서를 수정할 권한이 없습니다</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          뒤로 가기
        </button>
      </div>
    )
  }

  return <ProposalEditForm proposal={proposal} />
}
