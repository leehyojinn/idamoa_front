'use client'

import { useState } from 'react'
import SkillFilter, { getTagBySkillId } from './SkillFilter'
import CompanyList from './CompanyList'
import type { CompanyListResponse } from '@/lib/api/company'

interface CompanySectionProps {
  initialData?: CompanyListResponse
}

export default function CompanySection({ initialData }: CompanySectionProps) {
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined)

  const handleFilterChange = (skillId: string) => {
    setSelectedSkill(skillId)
    const tag = getTagBySkillId(skillId)
    setSelectedTag(tag)
  }

  return (
    <>
      <SkillFilter onFilterChange={handleFilterChange} />
      <CompanyList initialData={initialData} selectedTag={selectedTag} />
    </>
  )
}
