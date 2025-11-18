declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void
        width?: string | number
        height?: string | number
      }) => {
        open: () => void
        embed: (element: HTMLElement) => void
      }
    }
  }
}

export interface DaumPostcodeData {
  zonecode: string
  address: string
  addressEnglish: string
  addressType: 'R' | 'J'
  userSelectedType: 'R' | 'J'
  roadAddress: string
  roadAddressEnglish: string
  jibunAddress: string
  jibunAddressEnglish: string
  autoRoadAddress: string
  autoRoadAddressEnglish: string
  autoJibunAddress: string
  autoJibunAddressEnglish: string
  buildingCode: string
  buildingName: string
  apartment: 'Y' | 'N'
  sido: string
  sigungu: string
  sigunguCode: string
  roadnameCode: string
  bcode: string
  roadname: string
  bname: string
  bname1: string
  bname2: string
  hname: string
  query: string
}

export {}
