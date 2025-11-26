'use client'

import { useState } from 'react'
import {
  IoBrush,
  IoMegaphone,
  IoGlobe,
  IoSnow,
  IoStorefront,
  IoCall,
  IoShield,
  IoGitNetwork,
  IoDocument,
  IoBed,
  IoSparkles,
  IoShirt,
  IoPulse,
  IoCard,
} from 'react-icons/io5'

interface Skill {
  id: string
  label: string
  tag?: string // API 태그 이름
  icon: React.ComponentType<{ className?: string }>
  activeColor: string // 액티브 색상
}

const skills: Skill[] = [
  { id: 'all', label: '전체', icon: IoBrush, activeColor: 'bg-purple-600' },
  { id: 'interior', label: '인테리어', tag: '인테리어', icon: IoBrush, activeColor: 'bg-blue-600' },
  { id: 'marketing', label: '마케팅', tag: '마케팅', icon: IoMegaphone, activeColor: 'bg-pink-600' },
  { id: 'website', label: '홈페이지', tag: '홈페이지', icon: IoGlobe, activeColor: 'bg-indigo-600' },
  { id: 'aircon', label: '에어컨', tag: '에어컨', icon: IoSnow, activeColor: 'bg-cyan-600' },
  { id: 'signboard', label: '간판', tag: '간판', icon: IoStorefront, activeColor: 'bg-orange-600' },
  { id: 'phone', label: '인터넷/전화', tag: '인터넷/전화', icon: IoCall, activeColor: 'bg-green-600' },
  { id: 'security', label: '보안', tag: '보안', icon: IoShield, activeColor: 'bg-red-600' },
  { id: 'network', label: '네트워크', tag: '네트워크', icon: IoGitNetwork, activeColor: 'bg-teal-600' },
  { id: 'zoning', label: '용도변경', tag: '용도변경', icon: IoDocument, activeColor: 'bg-amber-600' },
  { id: 'bedding', label: '침구', tag: '침구', icon: IoBed, activeColor: 'bg-violet-600' },
  { id: 'cleaning', label: '정기청소', tag: '정기청소', icon: IoSparkles, activeColor: 'bg-yellow-600' },
  { id: 'uniform', label: '유니폼', tag: '유니폼', icon: IoShirt, activeColor: 'bg-sky-600' },
  { id: 'medical', label: '의료장비', tag: '의료장비', icon: IoPulse, activeColor: 'bg-rose-600' },
  { id: 'card', label: '카드체크기', tag: '카드체크기', icon: IoCard, activeColor: 'bg-emerald-600' },
]

// 스킬 ID로 태그 이름 가져오기
export const getTagBySkillId = (skillId: string): string | undefined => {
  const skill = skills.find(s => s.id === skillId)
  return skill?.tag
}

interface SkillFilterProps {
  onFilterChange?: (skillId: string) => void
}

export default function SkillFilter({ onFilterChange }: SkillFilterProps) {
  const [selectedSkill, setSelectedSkill] = useState('all')

  const handleSkillClick = (skillId: string) => {
    setSelectedSkill(skillId)
    onFilterChange?.(skillId)
  }

  return (
    <div className="skill-filter-section py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <IoBrush className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">전문영역별</span>
        </div>

        {/* 모바일: 줄바꿈 가능 */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:hidden gap-1">
          {skills.map((skill) => {
            const Icon = skill.icon
            const isSelected = selectedSkill === skill.id
            const bgColor = isSelected ? skill.activeColor : 'bg-gray-100 hover:bg-gray-200'
            const textColor = isSelected ? 'text-white' : 'text-gray-700'

            return (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id)}
                className={`${bgColor} rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5`}
              >
                <Icon className={`w-5 h-5 ${textColor}`} />
                <span className={`font-semibold text-xs ${textColor}`}>
                  {skill.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* PC: 가로 정렬 (스크롤 없음) */}
        <div className="hidden lg:flex flex-wrap gap-1">
          {skills.map((skill) => {
            const Icon = skill.icon
            const isSelected = selectedSkill === skill.id
            const bgColor = isSelected ? skill.activeColor : 'bg-gray-100 hover:bg-gray-200'
            const textColor = isSelected ? 'text-white' : 'text-gray-700'

            return (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id)}
                className={`${bgColor} rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 w-[85px] h-[80px]`}
              >
                <Icon className={`w-6 h-6 ${textColor}`} />
                <span className={`font-medium text-[0.8rem] ${textColor} whitespace-nowrap`}>
                  {skill.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
