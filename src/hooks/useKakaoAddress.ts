'use client'

import { useEffect, useState } from 'react'

interface DaumPostcodeData {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  buildingName: string
  apartment: string
  userSelectedType: string
}

interface DaumPostcode {
  new (options: {
    oncomplete: (data: DaumPostcodeData) => void
  }): {
    open: () => void
  }
}

declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcode
    }
  }
}

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

    // 스크립트 동적 로드
    const script = document.createElement('script')
    script.src =
      '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      setIsScriptLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      // cleanup: 스크립트 제거 (선택사항)
      // document.head.removeChild(script)
    }
  }, [])

  const openAddressSearch = (
    onComplete: (data: AddressData) => void
  ): void => {
    if (!isScriptLoaded || !window.daum) {
      console.error('Daum Postcode script is not loaded yet')
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data: DaumPostcodeData) {
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
