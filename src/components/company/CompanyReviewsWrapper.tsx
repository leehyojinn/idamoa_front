'use client'

import { useAuthStore } from '@/store/authStore'
import CompanyReviews from './CompanyReviews'

interface CompanyReviewsWrapperProps {
  companyUuid: string
  companyName: string
  companyOwnerEmail: string
}

export default function CompanyReviewsWrapper({
  companyUuid,
  companyName,
  companyOwnerEmail,
}: CompanyReviewsWrapperProps) {
  const { user } = useAuthStore()

  // 업체 주인인지 확인 (이메일 비교)
  const isOwner = user?.email === companyOwnerEmail

  return (
    <CompanyReviews
      companyUuid={companyUuid}
      companyName={companyName}
      isOwner={isOwner}
      currentUserEmail={user?.email || null}
    />
  )
}
