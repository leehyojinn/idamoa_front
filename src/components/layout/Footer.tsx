'use client'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Image
                src="/images/bi/bi-logo-wide-white.svg"
                alt="Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-400">
              환자를 위한 공간, 의료진을 위한 공간을 <br/>
              함께 고민하는 병원 인테리어 전문 플랫폼
            </p>
            <p className="text-gray-400 mt-4 border-t border-gray-800 pt-4 text-sm">
              회사명 : (주) 병원인테리어 다모아 <br/>
              사업자등록번호 : 456-81-01443 <br/>
              대표자 : 최유미 <br/>
              대표전화 : 02-543-3853 <br/>
              이메일 : damoawa@naver.com <br/>
              주소 : 서울시 성동구 아차산로 126 더리브세종타워 13층 1305호
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition-colors">제휴/광고 문의</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">고객센터</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                평일 09:00 ~ 18:00 <br/>
                점심 12:00 ~ 13:00 <br/>
                (주말/공휴일 휴무)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">커뮤니티 바로가기</h4>
            <ul className="flex items-center gap-4 text-gray-400">
              <li>
                <span title="카카오톡" className="text-blue-100 hover:text-white transition-colors duration-200 inline-block cursor-not-allowed">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.681l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.696.696 0 0 0-.653.447l-1.661 4.075a.472.472 0 0 0 .874.357l.33-.813h2.07l.299.8a.472.472 0 1 0 .884-.33l-.345-.926zM8.293 9.302a.472.472 0 0 0-.471-.472H4.577a.472.472 0 1 0 0 .944h1.16v3.736a.472.472 0 0 0 .944 0V9.774h1.14c.261 0 .472-.212.472-.472z">
                    </path>
                  </svg>
                </span>
              </li>
              <li>
                <span title="유튜브" className="text-blue-100 hover:text-white transition-colors duration-200 inline-block cursor-not-allowed">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z">
                    </path>
                  </svg>
                </span>
              </li>
              <li>
                <span title="인스타그램" className="text-blue-100 hover:text-white transition-colors duration-200 inline-block cursor-not-allowed">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z">
                    </path>
                  </svg>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>© 2025 병원인테리어 다모아. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
