'use client'

import { useState, useEffect } from 'react'
import * as IoIcons from 'react-icons/io5'
import { getPublicFilters, type PublicFilterOption } from '@/lib/api/filter'

// 기본 아이콘들
const {
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
  IoConstruct,
} = IoIcons

interface Skill {
  id: string
  label: string
  tag?: string // API 태그 이름
  icon: React.ComponentType<{ className?: string }>
  activeColor: string // 액티브 색상
}

// 문자열 아이콘 이름을 컴포넌트로 변환 (react-icons/io5의 모든 아이콘 지원)
const getIconByName = (iconName: string): React.ComponentType<{ className?: string }> => {
  // IoIcons 객체에서 동적으로 아이콘 찾기
  const IconComponent = (IoIcons as any)[iconName]

  // 아이콘을 찾았으면 반환, 없으면 기본 아이콘
  return IconComponent || IoConstruct
}

// 아이콘 매핑 (키워드 기반으로 아이콘 선택)
const getIconForSkill = (name: string): React.ComponentType<{ className?: string }> => {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('인테리어') || lowerName.includes('디자인') || lowerName.includes('시공')) return IoBrush
  if (lowerName.includes('마케팅') || lowerName.includes('광고') || lowerName.includes('seo') || lowerName.includes('sns')) return IoMegaphone
  if (lowerName.includes('홈페이지') || lowerName.includes('웹') || lowerName.includes('앱')) return IoGlobe
  if (lowerName.includes('에어컨') || lowerName.includes('냉난방')) return IoSnow
  if (lowerName.includes('간판')) return IoStorefront
  if (lowerName.includes('인터넷') || lowerName.includes('통신') || lowerName.includes('전화')) return IoCall
  if (lowerName.includes('보안') || lowerName.includes('자물쇠')) return IoShield
  if (lowerName.includes('네트워크') || lowerName.includes('시스템')) return IoGitNetwork
  if (lowerName.includes('용도변경')) return IoDocument
  if (lowerName.includes('침구')) return IoBed
  if (lowerName.includes('청소') || lowerName.includes('방역')) return IoSparkles
  if (lowerName.includes('유니폼')) return IoShirt
  if (lowerName.includes('의료') || lowerName.includes('병원')) return IoPulse
  if (lowerName.includes('카드')) return IoCard

  return IoConstruct // 기본 아이콘
}

// 색상 매핑
const colors = [
  'bg-purple-600',
  'bg-blue-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-orange-600',
  'bg-green-600',
  'bg-red-600',
  'bg-teal-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-yellow-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-emerald-600',
  'bg-lime-600',
  'bg-fuchsia-600',
  'bg-slate-600',
]

interface SkillFilterProps {
  onFilterChange?: (skillId: string) => void
}

export default function SkillFilter({ onFilterChange }: SkillFilterProps) {
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [skills, setSkills] = useState<Skill[]>([
    { id: 'all', label: '전체', icon: IoBrush, activeColor: 'bg-purple-600' }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSpecialtyFilters = async () => {
      try {
        setLoading(true)
        const filters = await getPublicFilters()

        // 전문영역 카테고리 찾기
        const specialtyCategory = filters.find(
          cat => cat.code === 'specialty' || cat.name.includes('전문')
        )

        if (specialtyCategory && specialtyCategory.options) {
          // API 옵션을 Skill 형식으로 변환
          const apiSkills: Skill[] = specialtyCategory.options
            .map((option, index) => {
              // API에서 icon이 있으면 사용, 없으면 자동 매핑
              const iconComponent = option.icon ? getIconByName(option.icon) : getIconForSkill(option.name)

              // API에서 color가 있으면 사용, 없으면 기본 색상
              const color = option.color || colors[index % colors.length]

              return {
                id: option.id.toString(),
                label: option.name,
                tag: option.name,
                icon: iconComponent,
                activeColor: color.startsWith('#') ? color : color, // hex 또는 tailwind 클래스 모두 지원
              }
            })

          setSkills([
            { id: 'all', label: '전체', icon: IoBrush, activeColor: 'bg-purple-600' },
            ...apiSkills
          ])
        }
      } finally {
        setLoading(false)
      }
    }

    loadSpecialtyFilters()
  }, [])

  const handleSkillClick = (skillId: string) => {
    setSelectedSkill(skillId)
    // 선택된 스킬의 태그 이름을 전달
    const skill = skills.find(s => s.id === skillId)
    const tagName = skillId === 'all' ? undefined : skill?.tag
    onFilterChange?.(tagName || skillId)
  }

  if (loading) {
    return (
      <div className="skill-filter-section py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <IoBrush className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">전문영역별</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:flex lg:flex-wrap gap-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg w-full lg:w-[85px] h-[70px] lg:h-[80px] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
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
            const isHexColor = skill.activeColor.startsWith('#')
            const bgClass = isSelected && !isHexColor ? skill.activeColor : ''
            const defaultBg = !isSelected ? 'bg-gray-100 hover:bg-gray-200' : ''
            const textColor = isSelected ? 'text-white' : 'text-gray-700'

            return (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id)}
                className={`${bgClass} ${defaultBg} rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5`}
                style={isSelected && isHexColor ? { backgroundColor: skill.activeColor } : undefined}
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
            const isHexColor = skill.activeColor.startsWith('#')
            const bgClass = isSelected && !isHexColor ? skill.activeColor : ''
            const defaultBg = !isSelected ? 'bg-gray-100 hover:bg-gray-200' : ''
            const textColor = isSelected ? 'text-white' : 'text-gray-700'

            return (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id)}
                className={`${bgClass} ${defaultBg} rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 w-[85px] h-[80px]`}
                style={isSelected && isHexColor ? { backgroundColor: skill.activeColor } : undefined}
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
