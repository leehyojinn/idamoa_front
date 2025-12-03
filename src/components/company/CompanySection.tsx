'use client'

import { useState } from 'react'
import SkillFilter from './SkillFilter'
import CompanyList from './CompanyList'
import type { CompanyListResponse } from '@/lib/api/company'

interface CompanySectionProps {
  initialData?: CompanyListResponse
}

export default function CompanySection({ initialData }: CompanySectionProps) {
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)

  const handleFilterChange = (tagName: string) => {
    // SkillFilter에서 이미 태그 이름을 전달하므로 그대로 사용
    setSelectedTag(tagName === 'all' ? undefined : tagName)
  }

  return (
    <>
      <SkillFilter onFilterChange={handleFilterChange} />
      <CompanyList initialData={initialData} selectedTag={selectedTag} />
    </>
  )
}
