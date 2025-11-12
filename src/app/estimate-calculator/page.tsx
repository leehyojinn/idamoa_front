'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface SubOption {
  label: string
  value: string
  minPrice: number
  maxPrice: number
}

interface SpaceOption {
  label: string
  value: string
  allowMultiple: boolean
  subOptions?: SubOption[]
}

interface HospitalType {
  label: string
  value: string
  priceMultiplier: number
}

interface ConstructionGrade {
  label: string
  value: string
  minPrice: number
  maxPrice: number
  description: string
}

export default function EstimateCalculatorPage() {
  // STEP1: 병원 공간 타입
  const hospitalTypes: HospitalType[] = [
    { label: '성형외과', value: '1', priceMultiplier: 1.2 },
    { label: '피부과', value: '2', priceMultiplier: 1.2 },
    { label: '정형외과', value: '3', priceMultiplier: 1.0 },
    { label: '내과', value: '4', priceMultiplier: 1.0 },
    { label: '치과', value: '5', priceMultiplier: 1.0 },
    { label: '안과', value: '6', priceMultiplier: 1.0 },
    { label: '한의원', value: '7', priceMultiplier: 1.0 },
    { label: '한방병원', value: '8', priceMultiplier: 1.0 },
    { label: '산부인과', value: '9', priceMultiplier: 1.0 },
    { label: '비뇨기과', value: '10', priceMultiplier: 1.0 },
    { label: '이비인후과', value: '11', priceMultiplier: 1.0 },
    { label: '가정의학과', value: '12', priceMultiplier: 1.0 },
    { label: '재활의학과', value: '13', priceMultiplier: 1.0 },
    { label: '신경외과', value: '14', priceMultiplier: 1.0 },
    { label: '마취통증학과', value: '15', priceMultiplier: 1.0 },
    { label: '정신과', value: '16', priceMultiplier: 1.0 },
    { label: '외과', value: '17', priceMultiplier: 1.0 },
    { label: '영상의학과', value: '18', priceMultiplier: 1.0 },
    { label: '소아과', value: '19', priceMultiplier: 1.0 },
    { label: '건강검진센터', value: '20', priceMultiplier: 1.0 },
    { label: '종합병원', value: '21', priceMultiplier: 1.0 },
  ]

  const constructionGrades: ConstructionGrade[] = [
    { label: '저가', value: 'low', minPrice: 150, maxPrice: 200, description: '기본 자재 및 시공' },
    { label: '중가', value: 'medium', minPrice: 200, maxPrice: 250, description: '중급 자재 및 시공' },
    { label: '고가', value: 'high', minPrice: 250, maxPrice: 300, description: '고급 자재 및 시공' },
  ]

  const spaceTypes: SpaceOption[] = [
    {
      label: '철거 공사',
      value: 'demolition',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 10, maxPrice: 20 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '냉난방 공사',
      value: 'hvac',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 20, maxPrice: 40 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '소방 및 방염공사',
      value: 'fire_prevention',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 5, maxPrice: 10 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '소방 스프링쿨러 공사',
      value: 'sprinkler',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 10, maxPrice: 15 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '음향 공사',
      value: 'sound',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 1, maxPrice: 5 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '통신장비 공사',
      value: 'communication',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 3, maxPrice: 10 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '커튼 및 블라인드',
      value: 'curtain_blind',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 3, maxPrice: 7 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '외부 공사',
      value: 'exterior',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 5, maxPrice: 20 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '화장실 공사',
      value: 'restroom',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 5, maxPrice: 20 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '간판 공사',
      value: 'signboard',
      allowMultiple: true,
      subOptions: [
        { label: '간판', value: 'sign_only', minPrice: 7, maxPrice: 20 },
        { label: '내부사인', value: 'sign_neon', minPrice: 4, maxPrice: 10 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '강제 배기 공사',
      value: 'exhaust',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 3, maxPrice: 10 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '전기증설 및 1차 인입공사',
      value: 'electrical_installation',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 3, maxPrice: 8 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '설비배관 1차 인입공사',
      value: 'plumbing_installation',
      allowMultiple: false,
      subOptions: [
        { label: '필요', value: 'required', minPrice: 3, maxPrice: 8},
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
    {
      label: '이동가구',
      value: 'movable_furniture',
      allowMultiple: true,
      subOptions: [
        { label: '대기실소파', value: 'sofa', minPrice: 5, maxPrice: 10 },
        { label: '진료의자/테이블', value: 'chair', minPrice: 5, maxPrice: 10 },
        { label: '인테리어 소품', value: 'interior_accessories', minPrice: 3, maxPrice: 10 },
        { label: '필요없음', value: 'not_required', minPrice: 0, maxPrice: 0 }
      ]
    },
  ]

  const spaceInfoMap: { [key: string]: string } = {
    'exterior': '건물 외부의 복도, 출입구, EV홀 공사 등을 포함합니다. 건물 외관을 개선하고 브랜드 이미지를 구축하는 공사입니다.',
    'exhaust': '실내 공기를 강제로 배출하는 환기 설비 공사입니다. 쾌적한 실내 환경 유지를 위해 오염된 공기를 외부로 배출하고 신선한 공기를 유입시킵니다.',
    'electrical_installation': '건물 외부에서 전기를 끌어오는 초기 전기 인입 공사 및 전기 용량 증설 공사입니다. 기존 전기 용량이 부족할 경우 필요합니다.',
    'plumbing_installation': '상하수도 배관을 건물 외부에서 끌어오는 초기 배관 공사입니다. 급수, 배수 시스템의 기본 인프라를 구축합니다.'
  }

  const screenPricePerUnit = { min: 10, max: 20 }

  // States
  const [selectedHospitalType, setSelectedHospitalType] = useState<string>('')
  const [area, setArea] = useState<number>(50)
  const [selectedConstructionGrade, setSelectedConstructionGrade] = useState<string>('')
  const [screenCount, setScreenCount] = useState<number>(0)
  const [selectedSpaces, setSelectedSpaces] = useState<Map<string, Set<string>>>(new Map())
  const [openInfoTooltip, setOpenInfoTooltip] = useState<string | null>(null)

  // Helper functions
  const getHospitalMultiplier = (): number => {
    const selected = hospitalTypes.find(t => t.value === selectedHospitalType)
    return selected ? selected.priceMultiplier : 1.0
  }

  const getAreaDiscount = (): number => {
    const discountRate = Math.floor(area / 50) * 0.11
    return Math.min(discountRate, 0.4)
  }

  const applyDiscount = (price: number): number => {
    const discount = getAreaDiscount()
    return price * (1 - discount)
  }

  const getHospitalTypeLabel = (): string => {
    const selected = hospitalTypes.find(t => t.value === selectedHospitalType)
    return selected ? selected.label : ''
  }

  const getConstructionGradeLabel = (): string => {
    const selected = constructionGrades.find(g => g.value === selectedConstructionGrade)
    return selected ? selected.label : ''
  }

  const getSelectedOptionsCount = (): number => {
    let count = 0
    selectedSpaces.forEach(options => {
      count += options.size
    })
    return count
  }

  const hasInfo = (spaceValue: string): boolean => {
    return !!spaceInfoMap[spaceValue]
  }

  const getInfo = (spaceValue: string): string => {
    return spaceInfoMap[spaceValue] || ''
  }

  const getSpaceIcon = (spaceValue: string): string => {
    const iconMap: { [key: string]: string } = {
      'demolition': '🔨',
      'hvac': '❄️',
      'fire_prevention': '🔥',
      'sprinkler': '💧',
      'sound': '🔊',
      'communication': '📡',
      'curtain_blind': '🪟',
      'insect_screen': '🪟',
      'movable_furniture': '🪑',
      'exterior': '🏗️',
      'restroom': '🚽',
      'signboard': '🪧',
      'exhaust': '💨',
      'electrical_installation': '⚡',
      'plumbing_installation': '🚰'
    }
    return iconMap[spaceValue] || '🏥'
  }

  // Event handlers
  const selectHospitalType = (type: string) => {
    setSelectedHospitalType(type)
  }

  const selectConstructionGrade = (grade: string) => {
    if (selectedConstructionGrade === grade) {
      setSelectedConstructionGrade('')
    } else {
      setSelectedConstructionGrade(grade)
    }
  }

  const decreaseArea = () => {
    if (area > 5) {
      setArea(Math.max(5, area - 5))
    }
  }

  const increaseArea = () => {
    if (area < 999) {
      setArea(Math.min(999, area + 5))
    }
  }

  const onAreaInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value === '') {
      setArea(0)
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setArea(numValue)
    }
  }

  const onAreaBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value)
    if (isNaN(value) || value < 5) {
      setArea(5)
    } else if (value > 999) {
      setArea(999)
    }
  }

  const increaseScreenCount = () => {
    setScreenCount(screenCount + 1)
  }

  const decreaseScreenCount = () => {
    if (screenCount > 0) {
      setScreenCount(screenCount - 1)
    }
  }

  const onScreenCountInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value === '') {
      setScreenCount(0)
      return
    }
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setScreenCount(numValue)
    }
  }

  const onScreenCountBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value)
    if (isNaN(value) || value < 0) {
      setScreenCount(0)
    }
  }

  const toggleInfoTooltip = (spaceValue: string) => {
    if (openInfoTooltip === spaceValue) {
      setOpenInfoTooltip(null)
    } else {
      setOpenInfoTooltip(spaceValue)
    }
  }

  const closeInfoTooltip = () => {
    setOpenInfoTooltip(null)
  }

  const selectSpaceOption = (spaceValue: string, subOptionValue: string) => {
    const spaces = new Map(selectedSpaces)
    const spaceType = spaceTypes.find(s => s.value === spaceValue)

    if (!spaceType) return

    let selectedOptions = spaces.get(spaceValue)

    if (!selectedOptions) {
      selectedOptions = new Set<string>()
      spaces.set(spaceValue, selectedOptions)
    } else {
      selectedOptions = new Set(selectedOptions)
      spaces.set(spaceValue, selectedOptions)
    }

    if (subOptionValue === 'not_required') {
      if (selectedOptions.has('not_required')) {
        spaces.delete(spaceValue)
      } else {
        selectedOptions.clear()
        selectedOptions.add('not_required')
      }
    } else {
      selectedOptions.delete('not_required')

      if (spaceType.allowMultiple) {
        if (selectedOptions.has(subOptionValue)) {
          selectedOptions.delete(subOptionValue)
          if (selectedOptions.size === 0) {
            spaces.delete(spaceValue)
          }
        } else {
          selectedOptions.add(subOptionValue)
        }
      } else {
        if (selectedOptions.has(subOptionValue)) {
          spaces.delete(spaceValue)
        } else {
          selectedOptions.clear()
          selectedOptions.add(subOptionValue)
        }
      }
    }

    setSelectedSpaces(spaces)
  }

  const isSpaceOptionSelected = (spaceValue: string, subOptionValue: string): boolean => {
    const selectedOptions = selectedSpaces.get(spaceValue)
    return selectedOptions ? selectedOptions.has(subOptionValue) : false
  }

  // Computed values
  const totalEstimate = useMemo(() => {
    let totalPerPyeong = 0

    const constructionGrade = constructionGrades.find(g => g.value === selectedConstructionGrade)
    if (constructionGrade) {
      const avgConstructionPrice = (constructionGrade.minPrice + constructionGrade.maxPrice) / 2
      totalPerPyeong += avgConstructionPrice
    }

    selectedSpaces.forEach((subOptionValues, spaceValue) => {
      const space = spaceTypes.find(s => s.value === spaceValue)
      if (space && space.subOptions) {
        subOptionValues.forEach(subOptionValue => {
          const selectedSubOption = space.subOptions!.find(opt => opt.value === subOptionValue)
          if (selectedSubOption) {
            const avgPrice = (selectedSubOption.minPrice + selectedSubOption.maxPrice) / 2
            totalPerPyeong += avgPrice
          }
        })
      }
    })

    const basePrice = totalPerPyeong * area * getHospitalMultiplier()
    const discountedPrice = applyDiscount(basePrice)

    const screenAvgPrice = (screenPricePerUnit.min + screenPricePerUnit.max) / 2
    const screenPrice = screenAvgPrice * screenCount

    return discountedPrice + screenPrice
  }, [selectedConstructionGrade, selectedSpaces, area, screenCount])

  const minEstimate = useMemo(() => {
    let totalPerPyeong = 0

    const constructionGrade = constructionGrades.find(g => g.value === selectedConstructionGrade)
    if (constructionGrade) {
      totalPerPyeong += constructionGrade.minPrice
    }

    selectedSpaces.forEach((subOptionValues, spaceValue) => {
      const space = spaceTypes.find(s => s.value === spaceValue)
      if (space && space.subOptions) {
        subOptionValues.forEach(subOptionValue => {
          const selectedSubOption = space.subOptions!.find(opt => opt.value === subOptionValue)
          if (selectedSubOption) {
            totalPerPyeong += selectedSubOption.minPrice
          }
        })
      }
    })

    const basePrice = totalPerPyeong * area * getHospitalMultiplier()
    const discountedPrice = applyDiscount(basePrice)

    const screenPrice = screenPricePerUnit.min * screenCount

    return discountedPrice + screenPrice
  }, [selectedConstructionGrade, selectedSpaces, area, screenCount])

  const maxEstimate = useMemo(() => {
    let totalPerPyeong = 0

    const constructionGrade = constructionGrades.find(g => g.value === selectedConstructionGrade)
    if (constructionGrade) {
      totalPerPyeong += constructionGrade.maxPrice
    }

    selectedSpaces.forEach((subOptionValues, spaceValue) => {
      const space = spaceTypes.find(s => s.value === spaceValue)
      if (space && space.subOptions) {
        subOptionValues.forEach(subOptionValue => {
          const selectedSubOption = space.subOptions!.find(opt => opt.value === subOptionValue)
          if (selectedSubOption) {
            totalPerPyeong += selectedSubOption.maxPrice
          }
        })
      }
    })

    const basePrice = totalPerPyeong * area * getHospitalMultiplier()
    const discountedPrice = applyDiscount(basePrice)

    const screenPrice = screenPricePerUnit.max * screenCount

    return discountedPrice + screenPrice
  }, [selectedConstructionGrade, selectedSpaces, area, screenCount])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-purple-800 py-16 px-4"
        >
          <div className="container mx-auto text-center text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              병원 인테리어 예상 견적 계산기
            </h1>
            <p className="text-base sm:text-lg mb-2">
              간편하게 예상 견적을 확인하세요
            </p>
            <div className="flex flex-wrap gap-2 justify-center items-center text-xs mt-4">
              <span className="px-3 py-1 border border-white/30 rounded-full">✓ 빠른 견적 확인</span>
              <span className="px-3 py-1 border border-white/30 rounded-full">✓ 실시간 계산</span>
              <span className="px-3 py-1 border border-white/30 rounded-full">✓ 무료 상담</span>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto py-6 sm:py-10 px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 입력 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 병원 공간 타입 선택 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-primary mb-2">
                병원 유형 선택
              </h2>
              <p className="text-sm text-gray-600 mb-4">인테리어할 병원 유형을 선택해 주세요</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {hospitalTypes.map((type, index) => (
                  <motion.div
                    key={type.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => selectHospitalType(type.value)}
                    className={`cursor-pointer rounded-xl p-3 border-2 transition-all hover:scale-105 flex items-center justify-center min-h-[70px] ${
                      selectedHospitalType === type.value
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <span className={`text-sm font-bold ${
                        selectedHospitalType === type.value ? 'text-primary' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                      {selectedHospitalType === type.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-1"
                        >
                          <svg className="w-4 h-4 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 평수 선택 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-primary mb-2">
                평수 입력
              </h2>
              <p className="text-sm text-gray-600 mb-6">버튼을 클릭하거나 직접 입력해 평수를 선택해 주세요</p>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 sm:p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={decreaseArea}
                      disabled={area <= 5}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-primary/10 border-2 border-primary/20 disabled:opacity-30 flex items-center justify-center transition-all hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    </button>

                    <div
                      className="bg-white rounded-2xl px-4 py-4 sm:px-8 sm:py-6 shadow-lg min-w-[160px] sm:min-w-[250px]"
                    >
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <input
                          type="number"
                          value={area}
                          onChange={onAreaInput}
                          onBlur={onAreaBlur}
                          min="1"
                          className="text-3xl sm:text-5xl font-bold text-primary text-center w-20 sm:w-32 outline-none border-none bg-transparent"
                        />
                        <div className="text-xl sm:text-2xl font-bold text-gray-700">평</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        약 {(area * 3.3).toFixed(1)}㎡
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={increaseArea}
                      disabled={area >= 999}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-primary/10 border-2 border-primary/20 disabled:opacity-30 flex items-center justify-center transition-all hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 본공사 등급 선택 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-primary mb-2">
                본공사 등급 선택
              </h2>
              <p className="text-sm text-gray-600 mb-4">자재 및 시공 등급을 선택해 주세요</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {constructionGrades.map((grade, index) => (
                  <motion.div
                    key={grade.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => selectConstructionGrade(grade.value)}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all hover:scale-105 ${
                      selectedConstructionGrade === grade.value
                        ? 'border-primary bg-primary/5 shadow-lg'
                        : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        selectedConstructionGrade === grade.value ? 'text-primary' : 'text-gray-700'
                      }`}>
                        {grade.label}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        {grade.description}
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {grade.minPrice}~{grade.maxPrice}만원/평
                      </div>
                      {selectedConstructionGrade === grade.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-3"
                        >
                          <svg className="w-6 h-6 text-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 공간형태 선택 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-primary mb-2">
                별도공사 (선택)
              </h2>
              <p className="text-sm text-gray-600 mb-4">원하는 옵션을 선택하시면 실시간으로 견적이 계산됩니다</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spaceTypes.map((space, spaceIndex) => (
                  <div key={space.value}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: spaceIndex * 0.05 }}
                      className="border-2 border-gray-300 rounded-xl p-4 hover:border-primary/30 transition-all bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <span className="text-xl">{getSpaceIcon(space.value)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-gray-700">{space.label}</h3>
                            {hasInfo(space.value) && (
                              <button
                                type="button"
                                onClick={() => toggleInfoTooltip(space.value)}
                                className="w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
                              >
                                <span className="text-xs font-bold">?</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{space.allowMultiple ? '중복 선택 가능' : '하나만 선택'}</p>
                        </div>
                      </div>

                      {/* 정보 툴팁 */}
                      <AnimatePresence>
                        {hasInfo(space.value) && openInfoTooltip === space.value && (
                          <motion.div
                            initial={{ opacity: 0, maxHeight: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, maxHeight: 200, marginBottom: 12 }}
                            exit={{ opacity: 0, maxHeight: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg relative">
                              <button
                                type="button"
                                onClick={closeInfoTooltip}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <p className="text-xs text-gray-700 pr-6">{getInfo(space.value)}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {space.subOptions && space.subOptions.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {space.subOptions.map((subOption) => (
                            <motion.div
                              key={subOption.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => selectSpaceOption(space.value, subOption.value)}
                              className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all ${
                                isSpaceOptionSelected(space.value, subOption.value)
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-gray-300 hover:border-primary/50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    isSpaceOptionSelected(space.value, subOption.value)
                                      ? 'border-primary bg-primary'
                                      : 'border-gray-300'
                                  }`}>
                                    {isSpaceOptionSelected(space.value, subOption.value) && (
                                      <motion.svg
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </motion.svg>
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium ${
                                    isSpaceOptionSelected(space.value, subOption.value) ? 'text-primary' : 'text-gray-700'
                                  }`}>
                                    {subOption.label}
                                  </span>
                                </div>
                                {subOption.minPrice > 0 ? (
                                  <div className="text-xs text-gray-600 font-medium">
                                    {subOption.minPrice}~{subOption.maxPrice}만원/평
                                  </div>
                                ) : (
                                  <div className="text-xs text-green-600 font-medium">무료</div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    {/* 설비배관 1차 인입공사 다음에 방충망 표시 */}
                    {space.value === 'plumbing_installation' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (spaceIndex + 1) * 0.05 }}
                        className="border-2 border-gray-300 rounded-xl p-4 hover:border-primary/30 transition-all bg-gray-50 mt-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🪟</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-gray-700">방충망</h3>
                            <p className="text-xs text-gray-500">개당 {screenPricePerUnit.min}~{screenPricePerUnit.max}만원</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-3 border-2 border-gray-300">
                          <button
                            type="button"
                            onClick={decreaseScreenCount}
                            disabled={screenCount <= 0}
                            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 border-none disabled:opacity-30 flex items-center justify-center transition-all hover:scale-110"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                            </svg>
                          </button>

                          <div
                            className="flex items-center gap-1"
                          >
                            <input
                              type="number"
                              value={screenCount}
                              onChange={onScreenCountInput}
                              onBlur={onScreenCountBlur}
                              min="0"
                              className="text-2xl font-bold text-primary text-center w-16 outline-none border-none bg-transparent"
                            />
                            <span className="text-lg font-bold text-gray-700">개</span>
                          </div>

                          <button
                            type="button"
                            onClick={increaseScreenCount}
                            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 border-none flex items-center justify-center transition-all hover:scale-110"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 오른쪽: 견적 결과 (고정) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="sticky top-24"
            >
              <div className="bg-gradient-to-br from-primary to-purple-700 text-white rounded-xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4">💰 예상 견적</h3>

                <motion.div
                  key={`${minEstimate}-${maxEstimate}`}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="bg-white/10 rounded-lg p-4 backdrop-blur-sm mb-4"
                >
                  <div className="text-3xl sm:text-4xl font-bold">
                    {minEstimate.toFixed(0)} ~ {maxEstimate.toFixed(0)}
                    <span className="text-lg">만원</span>
                  </div>
                  <div className="text-xs opacity-75 mt-2">
                    평균 약 {totalEstimate.toFixed(0)}만원
                  </div>
                </motion.div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">병원 유형</span>
                    <span className="font-medium">{getHospitalTypeLabel() || '미선택'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">평수</span>
                    <span className="font-medium">{area}평</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">본공사 등급</span>
                    <span className="font-medium">{getConstructionGradeLabel() || '미선택'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">방충망</span>
                    <span className="font-medium">{screenCount}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">선택 옵션</span>
                    <span className="font-medium">{getSelectedOptionsCount()}개</span>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-3 mb-4">
                  <div className="text-xs">
                    <p className="font-medium mb-1">※ 참고사항</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li>실제 견적은 현장 상황에 따라 달라질 수 있습니다</li>
                      <li>정확한 견적은 전문가 상담이 필요합니다</li>
                    </ul>
                  </div>
                </div>

                <Link
                  href="/estimates-write"
                  className="block w-full text-center py-3 bg-white text-primary hover:bg-white/90 font-bold rounded-lg transition-all hover:scale-105"
                >
                  정식 견적 문의하기
                </Link>
              </div>
            </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
