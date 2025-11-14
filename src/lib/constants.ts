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
  { label: '인테리어', value: 'interior' },
  { label: '마케팅', value: 'marketing' },
  { label: '홈페이지', value: 'website' },
  { label: '에어컨', value: 'aircon' },
  { label: '간판', value: 'signage' },
  { label: '인터넷 / 전화', value: 'communication' },
  { label: '보안', value: 'security' },
  { label: '네트워크', value: 'network' },
  { label: '용도변경', value: 'purpose_change' },
  { label: '침구', value: 'bedding' },
  { label: '정기청소', value: 'regular_cleaning' },
  { label: '유니폼', value: 'uniform' },
  { label: '의료장비', value: 'medical_equipment' },
  { label: '카드체크기', value: 'card_checker' },
] as const

// 전문 분야
export const SPECIALTY_LISTS = [
  { label: '피부과', value: 'dermatology' },
  { label: '성형외과', value: 'plastic_surgery' },
  { label: '정형외과', value: 'orthopedic' },
  { label: '내과', value: 'internal_medicine' },
  { label: '치과', value: 'dental' },
  { label: '안과', value: 'ophthalmology' },
  { label: '한의원', value: 'oriental_medicine' },
  { label: '한방병원', value: 'oriental_hospital' },
  { label: '산부인과', value: 'obstetrics_gynecology' },
  { label: '비뇨기과', value: 'urology' },
  { label: '이비인후과', value: 'ent' },
  { label: '가정의학과', value: 'family_medicine' },
  { label: '재활의학과', value: 'rehabilitation_medicine' },
  { label: '신경외과', value: 'neurosurgery' },
  { label: '마취통증의학과', value: 'anesthesiology' },
  { label: '정신과', value: 'psychiatry' },
  { label: '외과', value: 'surgery' },
  { label: '영상의학과', value: 'radiology' },
  { label: '소아과', value: 'pediatrics' },
  { label: '건강검진센터', value: 'health_checkup_center' },
  { label: '종합병원', value: 'general_hospital' },
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
