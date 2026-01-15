'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UserPlus,
  Building2,
  Images,
  MessageCircle,
  FileText,
  Users,
  User,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bell,
  Star,
  Mail,
  Calendar,
} from 'lucide-react'

interface GuideSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  steps: {
    title: string
    content: string
    tips?: string[]
  }[]
}

const guideSections: GuideSection[] = [
  {
    id: 'signup',
    title: '회원가입 및 로그인',
    icon: <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '다모아 서비스를 이용하기 위한 첫 단계입니다.',
    steps: [
      {
        title: '회원가입 방법',
        content:
          '홈페이지 우측 상단의 "회원가입" 버튼을 클릭합니다. 개인 회원과 업체 회원 중 선택하여 가입할 수 있습니다.',
        tips: [
          '개인 회원: 인테리어 업체를 찾고 견적을 받고 싶은 일반 사용자',
          '업체 회원: 인테리어 서비스를 제공하는 업체 (포트폴리오 등록, 견적 제안 가능)',
        ],
      },
      {
        title: '개인 회원 가입',
        content:
          '이메일, 비밀번호, 이름, 연락처 등 기본 정보를 입력합니다. 이메일 인증을 완료하면 가입이 완료됩니다.',
        tips: [
          '비밀번호는 8자 이상, 영문/숫자/특수문자를 조합하세요',
          '연락처는 상담 및 알림 수신에 사용됩니다',
        ],
      },
      {
        title: '업체 회원 가입',
        content:
          '기본 정보 외에 사업자등록번호, 업체명, 대표자명, 업종, 시공 가능 지역 등 추가 정보를 입력합니다.',
        tips: [
          '사업자등록증 사본이 필요할 수 있습니다',
          '정확한 정보 입력이 고객 신뢰도를 높입니다',
        ],
      },
      {
        title: '로그인',
        content:
          '가입한 이메일과 비밀번호로 로그인합니다. 소셜 로그인(카카오, 네이버, 구글)도 지원합니다.',
        tips: [
          '비밀번호를 잊으셨다면 "비밀번호 찾기"를 이용하세요',
          '자동 로그인 설정 시 다음 방문 때 자동으로 로그인됩니다',
        ],
      },
    ],
  },
  {
    id: 'companies',
    title: '업체 찾기',
    icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '원하는 조건에 맞는 인테리어 업체를 검색하고 비교해보세요.',
    steps: [
      {
        title: '업체 목록 접근',
        content:
          '상단 메뉴의 "업체 찾기"를 클릭하면 등록된 인테리어 업체 목록을 확인할 수 있습니다.',
      },
      {
        title: '필터 기능 활용',
        content:
          '지역, 업종(주거/상업/사무실 등), 시공 규모, 평점 등 다양한 조건으로 필터링할 수 있습니다.',
        tips: [
          '여러 필터를 조합하면 더 정확한 결과를 얻을 수 있습니다',
          '필터 초기화 버튼으로 모든 조건을 리셋할 수 있습니다',
        ],
      },
      {
        title: '업체 상세 정보 확인',
        content:
          '업체 카드를 클릭하면 상세 페이지로 이동합니다. 업체 소개, 시공 사례, 리뷰, 연락처 등을 확인할 수 있습니다.',
        tips: [
          '포트폴리오를 통해 실제 시공 품질을 확인하세요',
          '리뷰와 평점은 실제 고객의 후기입니다',
        ],
      },
      {
        title: '업체와 소통하기',
        content:
          '관심 있는 업체에 직접 채팅으로 문의하거나, 견적 요청을 보낼 수 있습니다.',
        tips: [
          '채팅은 실시간으로 업체와 대화할 수 있습니다',
          '여러 업체에 동시에 견적을 요청하여 비교해보세요',
        ],
      },
    ],
  },
  {
    id: 'portfolios',
    title: '포트폴리오 탐색',
    icon: <Images className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '인테리어 업체들의 실제 시공 사례를 살펴보세요.',
    steps: [
      {
        title: '포트폴리오 목록',
        content:
          '상단 메뉴의 "포트폴리오"를 클릭하면 다양한 인테리어 시공 사례를 볼 수 있습니다.',
      },
      {
        title: '카테고리별 탐색',
        content:
          '주거 공간(아파트, 빌라, 단독주택), 상업 공간(카페, 식당, 사무실) 등 카테고리별로 필터링할 수 있습니다.',
        tips: [
          '스타일(모던, 클래식, 북유럽 등)으로도 필터링 가능합니다',
          '면적대별 필터로 비슷한 규모의 사례를 찾아보세요',
        ],
      },
      {
        title: '포트폴리오 상세 보기',
        content:
          '포트폴리오를 클릭하면 상세 이미지, 시공 내용, 사용 자재, 예상 비용 등 자세한 정보를 확인할 수 있습니다.',
        tips: [
          '이미지를 클릭하면 확대하여 볼 수 있습니다',
          '마음에 드는 포트폴리오는 좋아요를 눌러 저장하세요',
        ],
      },
      {
        title: '업체 회원의 포트폴리오 등록',
        content:
          '업체 회원은 마이페이지에서 새로운 포트폴리오를 등록할 수 있습니다. 고품질 이미지와 상세한 설명을 작성하면 고객 유입에 도움이 됩니다.',
        tips: [
          '고해상도 이미지를 사용하세요 (최소 1920x1080 권장)',
          '시공 전/후 비교 사진이 있으면 더 효과적입니다',
          '사용한 자재와 브랜드를 명시하면 신뢰도가 높아집니다',
        ],
      },
    ],
  },
  {
    id: 'consultation',
    title: '빠른상담',
    icon: <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '간편하게 인테리어 상담을 신청하세요.',
    steps: [
      {
        title: '빠른상담이란?',
        content:
          '복잡한 절차 없이 간단한 정보만으로 빠르게 상담을 신청할 수 있는 서비스입니다.',
      },
      {
        title: '상담 신청 방법',
        content:
          '상단 메뉴의 "빠른상담"을 클릭한 후 "상담 신청" 버튼을 누릅니다. 공간 종류, 희망 시공 내용, 예산 범위, 연락처 등을 입력합니다.',
        tips: [
          '구체적으로 작성할수록 정확한 답변을 받을 수 있습니다',
          '희망 연락 시간을 명시하면 편리합니다',
        ],
      },
      {
        title: '상담 진행 상태 확인',
        content:
          '신청한 상담의 진행 상태를 확인할 수 있습니다. 상태는 "접수됨", "진행중", "완료", "취소"로 구분됩니다.',
        tips: [
          '"내 글만 보기" 필터로 본인의 상담만 확인할 수 있습니다',
          '상담 완료 후 업체를 평가해주시면 다른 분들께 도움이 됩니다',
        ],
      },
      {
        title: '상담 수정/삭제',
        content:
          '진행 전 상태의 상담은 수정하거나 삭제할 수 있습니다. 상담 상세 페이지에서 수정/삭제 버튼을 이용하세요.',
      },
    ],
  },
  {
    id: 'planner',
    title: '플래너 상담',
    icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '전문 인테리어 플래너와 1:1 상담을 받아보세요.',
    steps: [
      {
        title: '플래너 상담이란?',
        content:
          '인테리어 전문 플래너가 직접 고객의 요구사항을 파악하고 맞춤 컨설팅을 제공하는 프리미엄 서비스입니다.',
      },
      {
        title: '상담 신청',
        content:
          '상단 메뉴의 "플래너 상담"에서 신청할 수 있습니다. 상담 방법(온라인/방문), 요청 타입(컨설팅/설계/시공 등)을 선택합니다.',
        tips: [
          '온라인 상담: 화상 또는 전화로 진행',
          '방문 상담: 현장에서 직접 상담 (추가 비용 발생 가능)',
        ],
      },
      {
        title: '상담 정보 입력',
        content:
          '공간 정보, 희망 스타일, 예산, 원하는 상담 일정 등을 상세히 입력합니다.',
        tips: [
          '도면이나 현장 사진이 있으면 첨부하세요',
          '구체적인 요구사항을 적어주시면 더 정확한 상담이 가능합니다',
        ],
      },
      {
        title: '내 신청 현황',
        content:
          '"내 신청현황" 메뉴에서 신청한 플래너 상담의 진행 상태를 확인할 수 있습니다.',
      },
    ],
  },
  {
    id: 'estimates',
    title: '견적 요청',
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '원하는 인테리어에 대한 견적을 받아보세요.',
    steps: [
      {
        title: '견적 요청이란?',
        content:
          '인테리어 공사에 필요한 비용을 여러 업체로부터 받아 비교할 수 있는 서비스입니다.',
      },
      {
        title: '견적 요청 작성',
        content:
          '상단 메뉴의 "견적"에서 "견적 요청하기"를 클릭합니다. 공간 종류, 면적, 시공 범위, 희망 예산, 일정 등을 입력합니다.',
        tips: [
          '도면 파일(PDF, 이미지)을 첨부하면 정확한 견적을 받을 수 있습니다',
          '시공 범위를 구체적으로 작성하세요 (전체 리모델링, 부분 시공 등)',
          '현장 사진을 첨부하면 업체의 이해도가 높아집니다',
        ],
      },
      {
        title: '견적 계산기 활용',
        content:
          '견적 계산기를 통해 예상 비용을 미리 확인할 수 있습니다. 공간과 시공 항목을 선택하면 대략적인 비용이 산출됩니다.',
        tips: [
          '계산기 결과는 참고용이며, 실제 비용은 다를 수 있습니다',
          '자재 등급에 따라 비용 차이가 큽니다',
        ],
      },
      {
        title: '제안서 확인',
        content:
          '견적 요청을 등록하면 관심 있는 업체들이 제안서를 보내옵니다. 여러 제안서를 비교하여 최적의 업체를 선택하세요.',
        tips: [
          '가격뿐만 아니라 시공 품질, 후기, A/S 정책도 확인하세요',
          '궁금한 점은 업체에 직접 채팅으로 문의하세요',
        ],
      },
      {
        title: '업체 회원의 제안서 작성',
        content:
          '업체 회원은 등록된 견적 요청에 제안서를 작성하여 응답할 수 있습니다. 상세하고 경쟁력 있는 제안서를 작성하세요.',
        tips: [
          '견적 상세 내역을 명확히 작성하세요',
          '시공 기간과 A/S 정책을 명시하면 신뢰도가 높아집니다',
          '포트폴리오 링크를 첨부하여 실력을 어필하세요',
        ],
      },
    ],
  },
  {
    id: 'community',
    title: '커뮤니티',
    icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '인테리어에 관한 정보를 공유하고 소통하세요.',
    steps: [
      {
        title: '커뮤니티 둘러보기',
        content:
          '상단 메뉴의 "커뮤니티"를 클릭하면 다양한 인테리어 관련 게시글을 볼 수 있습니다.',
      },
      {
        title: '카테고리별 탐색',
        content:
          '인테리어 팁, 시공 후기, 질문/답변, 자유게시판 등 카테고리별로 게시글을 탐색할 수 있습니다.',
      },
      {
        title: '게시글 작성',
        content:
          '로그인 후 "글쓰기" 버튼을 클릭하여 새 게시글을 작성할 수 있습니다. 카테고리를 선택하고 제목, 내용을 입력합니다.',
        tips: [
          '이미지를 첨부하면 더 많은 관심을 받을 수 있습니다',
          '태그를 달면 검색에 노출될 확률이 높아집니다',
        ],
      },
      {
        title: '댓글 및 좋아요',
        content:
          '다른 사용자의 게시글에 댓글을 달거나 좋아요를 눌러 소통할 수 있습니다.',
        tips: [
          '건설적인 댓글은 커뮤니티 활성화에 도움이 됩니다',
          '유용한 정보에는 좋아요를 눌러주세요',
        ],
      },
    ],
  },
  {
    id: 'mypage',
    title: '마이페이지',
    icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '내 정보와 활동 내역을 관리하세요.',
    steps: [
      {
        title: '마이페이지 접근',
        content:
          '로그인 후 우측 상단의 프로필 아이콘을 클릭하면 마이페이지로 이동합니다.',
      },
      {
        title: '프로필 수정',
        content:
          '이름, 연락처, 프로필 이미지 등 기본 정보를 수정할 수 있습니다.',
      },
      {
        title: '비밀번호 변경',
        content:
          '보안을 위해 주기적으로 비밀번호를 변경하세요. 현재 비밀번호 확인 후 새 비밀번호를 설정합니다.',
      },
      {
        title: '업체 등록 (개인→업체 전환)',
        content:
          '개인 회원도 사업자 정보를 등록하여 업체 회원으로 전환할 수 있습니다.',
        tips: [
          '사업자등록번호와 업체 정보가 필요합니다',
          '전환 후 포트폴리오 등록, 견적 제안 등이 가능해집니다',
        ],
      },
      {
        title: '업체 프로필 수정',
        content:
          '업체 회원은 업체 소개, 시공 가능 지역, 전문 분야 등을 수정할 수 있습니다.',
      },
      {
        title: '내 활동 관리',
        content:
          '작성한 게시글, 견적 요청, 상담 내역, 찜한 업체/포트폴리오 등을 확인할 수 있습니다.',
      },
    ],
  },
  {
    id: 'credits',
    title: '크레딧 시스템',
    icon: <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '크레딧을 구매하고 프리미엄 기능을 이용하세요.',
    steps: [
      {
        title: '크레딧이란?',
        content:
          '다모아에서 사용되는 가상 화폐입니다. 포트폴리오 홍보 등 프리미엄 기능에 사용됩니다.',
      },
      {
        title: '크레딧 충전',
        content:
          '마이페이지 > 크레딧 관리 > 크레딧 구매에서 원하는 금액만큼 충전할 수 있습니다.',
        tips: [
          '신용카드, 계좌이체, 간편결제 등 다양한 결제 수단 지원',
          '대량 구매 시 할인 혜택이 있을 수 있습니다',
        ],
      },
      {
        title: '크레딧 사용',
        content:
          '포트폴리오 홍보, 프리미엄 노출 등에 크레딧을 사용할 수 있습니다.',
        tips: [
          '홍보 기간과 효과를 확인한 후 신청하세요',
          '남은 크레딧은 마이페이지에서 확인할 수 있습니다',
        ],
      },
      {
        title: '거래 내역 확인',
        content:
          '마이페이지 > 크레딧 관리 > 거래 내역에서 충전 및 사용 내역을 확인할 수 있습니다.',
      },
      {
        title: '환불 요청',
        content:
          '미사용 크레딧에 대해 환불을 요청할 수 있습니다. 환불 정책을 확인 후 신청하세요.',
        tips: [
          '사용한 크레딧은 환불되지 않습니다',
          '환불 처리는 영업일 기준 3~5일 소요됩니다',
        ],
      },
    ],
  },
  {
    id: 'chat',
    title: '실시간 채팅',
    icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '업체와 실시간으로 대화하세요.',
    steps: [
      {
        title: '채팅 시작하기',
        content:
          '업체 상세 페이지나 포트폴리오에서 "채팅하기" 버튼을 클릭하면 해당 업체와 1:1 채팅을 시작할 수 있습니다.',
      },
      {
        title: '채팅 기능',
        content:
          '텍스트 메시지, 이미지 전송이 가능합니다. 실시간으로 대화하며 궁금한 점을 바로 해결하세요.',
        tips: [
          '현장 사진을 공유하면 더 정확한 상담이 가능합니다',
          '업무 시간 외에는 답변이 늦어질 수 있습니다',
        ],
      },
      {
        title: '채팅 목록 확인',
        content:
          '우측 상단의 채팅 아이콘을 클릭하면 진행 중인 모든 채팅 목록을 확인할 수 있습니다.',
      },
      {
        title: '알림 설정',
        content:
          '새 메시지가 도착하면 알림을 받을 수 있습니다. 브라우저 알림을 허용해주세요.',
      },
    ],
  },
  {
    id: 'notifications',
    title: '알림',
    icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '중요한 소식을 놓치지 마세요.',
    steps: [
      {
        title: '알림 확인',
        content:
          '우측 상단의 종 모양 아이콘을 클릭하면 알림 목록을 확인할 수 있습니다.',
      },
      {
        title: '알림 종류',
        content:
          '새 제안서 도착, 상담 상태 변경, 채팅 메시지, 댓글 알림 등 다양한 알림을 받을 수 있습니다.',
        tips: [
          '읽지 않은 알림은 빨간 배지로 표시됩니다',
          '알림을 클릭하면 해당 페이지로 이동합니다',
        ],
      },
    ],
  },
  {
    id: 'inquiry',
    title: '문의하기',
    icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6" />,
    description: '서비스 이용 중 궁금한 점을 문의하세요.',
    steps: [
      {
        title: '일반 문의',
        content:
          '서비스 이용 중 불편사항이나 궁금한 점은 "문의하기"에서 접수할 수 있습니다.',
        tips: [
          '문의 유형을 선택하면 더 빠른 답변을 받을 수 있습니다',
          '캡처 이미지를 첨부하면 문제 파악이 쉬워집니다',
        ],
      },
      {
        title: '제휴/광고 문의',
        content:
          '업체 제휴나 광고에 관심이 있으시다면 "제휴/광고 문의"를 이용하세요.',
      },
      {
        title: '내 문의 확인',
        content:
          '"내 문의"에서 접수한 문의의 처리 상태와 답변을 확인할 수 있습니다.',
      },
    ],
  },
]

export default function GuideContent() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'signup',
  ])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const expandAll = () => {
    setExpandedSections(guideSections.map((s) => s.id))
  }

  const collapseAll = () => {
    setExpandedSections([])
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-800 to-primary text-white py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            이용가이드
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-primary-300 max-w-2xl">
            다모아 서비스를 효과적으로 이용하는 방법을 안내해 드립니다.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            원하는 항목을 클릭하여 자세한 사용법을 확인하세요.
          </p>
        </div>
      </div>

      {/* Quick Navigation - 모바일에서는 숨김 */}
      <div className="hidden md:block bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-600">바로가기:</span>
            <div className="flex flex-wrap gap-2">
              {guideSections.slice(0, 8).map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    const element = document.getElementById(section.id)
                    element?.scrollIntoView({ behavior: 'smooth' })
                    if (!expandedSections.includes(section.id)) {
                      toggleSection(section.id)
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary rounded-full transition-colors"
                >
                  {section.title}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
              >
                전체 펼치기
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
              >
                전체 접기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 전용 전체 펼치기/접기 */}
      <div className="md:hidden bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-end gap-3">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-primary transition-colors"
            >
              전체 펼치기
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-primary transition-colors"
            >
              전체 접기
            </button>
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          {guideSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-20 sm:scroll-mt-24"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="p-2 sm:p-3 bg-primary-100 text-primary rounded-lg sm:rounded-xl flex-shrink-0">
                    {section.icon}
                  </div>
                  <div className="text-left min-w-0">
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                      {section.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400 flex-shrink-0 ml-2">
                  {expandedSections.includes(section.id) ? (
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {expandedSections.includes(section.id) && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                  <div className="space-y-5 sm:space-y-6 mt-4 sm:mt-6">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="relative pl-7 sm:pl-8">
                        {/* Step Number */}
                        <div className="absolute left-0 top-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                          {stepIndex + 1}
                        </div>

                        {/* Step Content */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                            {step.content}
                          </p>

                          {/* Tips */}
                          {step.tips && step.tips.length > 0 && (
                            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                              <p className="text-xs sm:text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                TIP
                              </p>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li
                                    key={tipIndex}
                                    className="text-xs sm:text-sm text-amber-700 flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Connector Line */}
                        {stepIndex < section.steps.length - 1 && (
                          <div className="absolute left-[9px] sm:left-[11px] top-6 sm:top-7 w-0.5 h-[calc(100%+0.75rem)] sm:h-[calc(100%+1rem)] bg-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-8 sm:mt-12">
          <div className="bg-gradient-to-r from-primary-800 to-primary rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  더 궁금한 점이 있으신가요?
                </h3>
                <p className="text-primary-300 text-sm sm:text-base">
                  고객센터로 문의해주시면 친절하게 안내해 드리겠습니다.
                </p>
              </div>
              <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Link
                  href="/inquiries"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-primary font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  문의하기
                </Link>
                <Link
                  href="/notices"
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  공지사항
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
