'use client'

import { useRouter } from 'next/navigation'
import { FiUser, FiUsers } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ProfileTypePage() {
  const router = useRouter()

  const handleSelectType = (type: 'user' | 'company') => {
    if (type === 'user') {
      router.push('/signup/profile/user')
    } else {
      router.push('/signup/profile/company')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showQuickmenu={false} />
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            프로필 타입 선택
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            사용하실 프로필 타입을 선택해주세요
          </p>
        </div>

        {/* Profile Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* USER Profile */}
          <button
            onClick={() => handleSelectType('user')}
            className="group relative bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <FiUser className="w-10 h-10 text-indigo-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">일반 사용자</h3>

              <p className="text-sm text-gray-600 text-center">
                인테리어 정보를 찾고, 업체를 비교하며, 예약할 수 있습니다
              </p>

              <ul className="text-sm text-gray-500 space-y-2 text-left w-full">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>인테리어 정보 검색</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>업체 비교 및 예약</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>리뷰 작성 및 공유</span>
                </li>
              </ul>

              <div className="mt-4 w-full">
                <div className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium group-hover:bg-indigo-700 transition-colors">
                  선택하기
                </div>
              </div>
            </div>
          </button>

          {/* COMPANY Profile */}
          <button
            onClick={() => handleSelectType('company')}
            className="group relative bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <FiUsers className="w-10 h-10 text-purple-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900">업체 등록</h3>

              <p className="text-sm text-gray-600 text-center">
                인테리어 관련 서비스를 제공하고, 고객을 관리할 수 있습니다
              </p>

              <ul className="text-sm text-gray-500 space-y-2 text-left w-full">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>업체 정보 등록</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>예약 및 고객 관리</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>마케팅 및 프로모션</span>
                </li>
              </ul>

              <div className="mt-4 w-full">
                <div className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium group-hover:bg-purple-700 transition-colors">
                  선택하기
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            나중에 프로필 타입을 변경할 수 있습니다
          </p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
