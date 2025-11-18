'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IoDocumentTextOutline } from 'react-icons/io5'
import ProposalDetailClient from './ProposalDetailClient'
import { getProposal, type Proposal } from '@/lib/api/proposal'
import { getEstimateRequest, type EstimateRequestDetail } from '@/lib/api/estimate'
import { showErrorToast } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useMyCompany } from '@/hooks/useCompany'

interface ProposalDetailClientWrapperProps {
  uuid: string
}

export default function ProposalDetailClientWrapper({ uuid }: ProposalDetailClientWrapperProps) {
  const router = useRouter()
  const { data: profileResponse } = useProfile()
  const { data: myCompanyResponse } = useMyCompany(profileResponse?.data?.profileType === 'COMPANY')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [estimateRequest, setEstimateRequest] = useState<EstimateRequestDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. 제안서 정보 가져오기
        const proposalResult = await getProposal(uuid)
        if (proposalResult.success && proposalResult.data) {
          setProposal(proposalResult.data)

          // 2. 견적의뢰 정보 가져오기 (권한 체크용)
          try {
            const estimateResult = await getEstimateRequest(proposalResult.data.requestUuid)
            if (estimateResult.success && estimateResult.data) {
              setEstimateRequest(estimateResult.data)
            }
          } catch (err) {
            // 견적의뢰 정보를 못 가져와도 제안서는 표시
            console.error('Failed to fetch estimate request:', err)
          }
        } else {
          setError(true)
        }
      } catch (error: any) {
        console.error('Failed to fetch proposal:', error)

        // 403 에러인 경우 권한 없음 메시지
        if (error?.response?.status === 403) {
          showErrorToast(error, '이 제안서를 볼 권한이 없습니다')
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

  // 1. 제안서 작성자(업체) 확인
  const isCompanyOwner = !!(
    profile &&
    profile.profileType === 'COMPANY' &&
    myCompany &&
    myCompany.id === proposal.companyId
  )

  // 2. 견적의뢰 작성자 확인
  const isRequester = !!(
    profile &&
    estimateRequest &&
    profile.profileType === 'USER_PROFILE' &&
    profile.id === estimateRequest.userId
  )

  // 3. 권한별 액션 가능 여부
  const canAccept = isRequester && (proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED')
  const canReject = isRequester && (proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED')
  const canEdit = isCompanyOwner && (proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED')
  const canWithdraw = isCompanyOwner && (proposal.status === 'SUBMITTED' || proposal.status === 'VIEWED')

  return (
    <ProposalDetailClient
      initialData={proposal}
      canAccept={canAccept}
      canReject={canReject}
      canEdit={canEdit}
      canWithdraw={canWithdraw}
    />
  )
}
