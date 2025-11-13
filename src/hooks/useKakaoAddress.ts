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
    kakao?: {
      maps: {
        services: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: { x: string; y: string }[], status: string) => void
            ) => void
          }
        }
        load: (callback: () => void) => void
      }
    }
  }
}

interface AddressData {
  address: string
  zonecode: string
  roadAddress: string
  jibunAddress: string
  buildingName: string
  latitude?: number
  longitude?: number
}

export const useKakaoAddress = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    // 이미 스크립트가 로드되었는지 확인
    if (window.daum?.Postcode && window.kakao?.maps) {
      setIsScriptLoaded(true)
      return
    }

    // Daum Postcode 스크립트 동적 로드
    const postcodeScript = document.createElement('script')
    postcodeScript.src =
      '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    postcodeScript.async = true

    // Kakao Maps 스크립트 동적 로드
    const mapsScript = document.createElement('script')
    mapsScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services&autoload=false`
    mapsScript.async = true

    let postcodeLoaded = false
    let mapsLoaded = false

    const checkAllLoaded = () => {
      if (postcodeLoaded && mapsLoaded) {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            setIsScriptLoaded(true)
          })
        }
      }
    }

    postcodeScript.onload = () => {
      postcodeLoaded = true
      checkAllLoaded()
    }

    mapsScript.onload = () => {
      mapsLoaded = true
      checkAllLoaded()
    }

    document.head.appendChild(postcodeScript)
    document.head.appendChild(mapsScript)

    return () => {
      // cleanup: 스크립트 제거 (선택사항)
      // document.head.removeChild(postcodeScript)
      // document.head.removeChild(mapsScript)
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

        // Geocoder를 사용해서 좌표 가져오기
        if (window.kakao?.maps?.services) {
          const geocoder = new window.kakao.maps.services.Geocoder()
          geocoder.addressSearch(fullAddress, (result, status) => {
            if (status === 'OK' && result.length > 0) {
              addressData.latitude = parseFloat(result[0].y)
              addressData.longitude = parseFloat(result[0].x)
            }
            onComplete(addressData)
          })
        } else {
          onComplete(addressData)
        }
      },
    }).open()
  }

  return {
    isScriptLoaded,
    openAddressSearch,
  }
}
