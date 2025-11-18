'use client'

import { useEffect, useState } from 'react'

interface AddressData {
  address: string
  zonecode: string
  roadAddress: string
  jibunAddress: string
  buildingName: string
}

export const useKakaoAddress = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    // 이미 스크립트가 로드되었는지 확인
    if (window.daum?.Postcode) {
      setIsScriptLoaded(true)
      return
    }

    // Daum Postcode 스크립트 동적 로드
    const postcodeScript = document.createElement('script')
    postcodeScript.src =
      '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    postcodeScript.async = true

    postcodeScript.onload = () => {
      setIsScriptLoaded(true)
    }

    postcodeScript.onerror = () => {
      // 스크립트 로드 실패
    }

    document.head.appendChild(postcodeScript)

    return () => {
      // cleanup: 스크립트 제거 (선택사항)
    }
  }, [])

  const openAddressSearch = (
    onComplete: (data: AddressData) => void
  ): void => {
    if (!isScriptLoaded || !window.daum) {
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 우선, 없으면 지번 주소 사용
        const fullAddress = data.roadAddress || data.jibunAddress
        const buildingName = data.buildingName || ''

        const addressData: AddressData = {
          address: fullAddress,
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          buildingName: buildingName,
        }

        onComplete(addressData)
      },
    }).open()
  }

  return {
    isScriptLoaded,
    openAddressSearch,
  }
}
