// 서비스 지역
export const LOCATION_LISTS = [
  { label: '서울', value: 'seoul' },
  { label: '경기', value: 'gyeonggi' },
  { label: '인천', value: 'incheon' },
  { label: '부산', value: 'busan' },
  { label: '대구', value: 'daegu' },
  { label: '광주', value: 'gwangju' },
  { label: '대전', value: 'daejeon' },
  { label: '세종', value: 'sejong' },
  { label: '강원', value: 'gangwon' },
  { label: '충북', value: 'chungbuk' },
  { label: '충남', value: 'chungnam' },
  { label: '전북', value: 'jeonbuk' },
  { label: '전남', value: 'jeonnam' },
  { label: '경북', value: 'gyeongbuk' },
  { label: '경남', value: 'gyeongnam' },
  { label: '제주', value: 'jeju' },
] as const

// 전문 서비스
export const SKILL_LISTS = [
  { label: '인테리어', value: '인테리어' },
  { label: '마케팅', value: '마케팅' },
  { label: '홈페이지', value: '홈페이지' },
  { label: '에어컨', value: '에어컨' },
  { label: '간판', value: '간판' },
  { label: '인터넷 / 전화', value: '인터넷/전화' },
  { label: '보안', value: '보안' },
  { label: '네트워크', value: '네트워크' },
  { label: '용도변경', value: '용도변경' },
  { label: '침구', value: '침구' },
  { label: '정기청소', value: '정기청소' },
  { label: '유니폼', value: '유니폼' },
  { label: '의료장비', value: '의료장비' },
  { label: '카드체크기', value: '카드체크기' },
] as const

// 전문 분야
export const SPECIALTY_LISTS = [
  { label: '피부과', value: '피부과' },
  { label: '성형외과', value: '성형외과' },
  { label: '정형외과', value: '정형외과' },
  { label: '내과', value: '내과' },
  { label: '치과', value: '치과' },
  { label: '안과', value: '안과' },
  { label: '한의원', value: '한의원' },
  { label: '한방병원', value: '한방병원' },
  { label: '산부인과', value: '산부인과' },
  { label: '비뇨기과', value: '비뇨기과' },
  { label: '이비인후과', value: '이비인후과' },
  { label: '가정의학과', value: '가정의학과' },
  { label: '재활의학과', value: '재활의학과' },
  { label: '신경외과', value: '신경외과' },
  { label: '마취통증의학과', value: '마취통증의학과' },
  { label: '정신과', value: '정신과' },
  { label: '외과', value: '외과' },
  { label: '영상의학과', value: '영상의학과' },
  { label: '소아과', value: '소아과' },
  { label: '건강검진센터', value: '건강검진센터' },
  { label: '종합병원', value: '종합병원' },
] as const

// 요일 매핑
export const DAY_MAP: Record<string, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
} as const

// 요일 순서
export const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
