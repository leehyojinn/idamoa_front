'use client'

import {useState} from 'react'
import Link from 'next/link'
import {
    FaGavel,
    FaCalendarDays,
    FaBuilding,
    FaFolderOpen,
    FaChevronRight,
    FaChevronLeft,
    FaHouse,
    FaLightbulb
} from 'react-icons/fa6'

interface QuickMenuItem {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
}

export default function Quickmenu() {
    const quickMenuItems: QuickMenuItem[] = [
        {
            id: 'estimates',
            label: '견적의뢰',
            icon: FaGavel,
            href: '/estimates'
        }, {
            id: 'notices',
            label: '공지/이벤트',
            icon: FaLightbulb,
            href: '/notices'
        }, {
            id: 'planner',
            label: '플래너신청',
            icon: FaCalendarDays,
            href: '/planner'
        }, {
            id: 'companies',
            label: '업체찾기',
            icon: FaBuilding,
            href: '/companies'
        }
        // {
        //     id: 'resources',
        //     label: '자료실',
        //     icon: FaFolderOpen,
        //     href: '/resources'
        // }
    ]

    const [hovered, setHovered] = useState < string | null > (null)
    const [isOpen, setIsOpen] = useState(true)

    const scrollToTop = () => {
        window.scrollTo({top: 0, behavior: 'smooth'})
    }

    // 퀵메뉴 숨김 처리
    return null

    return (
        <div>
            {/* PC 퀵메뉴 패널 */}
            <div
                className={`fixed top-1/2 -translate-y-1/2 right-6 z-50 flex-col items-center bg-gray-100/90 rounded-[100px] px-3 py-5 space-y-5 shadow-lg backdrop-blur-sm select-none overflow-visible transition-[transform,opacity] duration-500 ease-in-out hidden lg:flex ${
                isOpen
                    ? 'w-[100px] translate-x-0 opacity-100'
                    : 'w-12 translate-x-24 opacity-0 pointer-events-none'}`}>
                {/* 숨기기 버튼 */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="mt-3 cursor-pointer flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md text-primary font-semibold text-sm hover:bg-primary-100 transition select-none"
                    aria-label="숨기기"
                    title="숨기기">
                    <FaChevronRight className="w-6 h-6"/>
                </button>

                {/* 메뉴 아이템 (열렸을 때만 보임) */}
                {
                    isOpen && (
                        <div>
                            {
                                quickMenuItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative mb-7 flex flex-col items-center w-full"
                                        onMouseEnter={() => setHovered(item.id)}
                                        onMouseLeave={() => setHovered(null)}>
                                        <Link
                                            href={item.href}
                                            className="flex flex-col items-center rounded-lg focus:outline-none hover:bg-primary-100 transition w-full cursor-pointer"
                                            aria-label={item.label}
                                            title={item.label}>
                                            <item.icon className="w-6 h-6 text-primary"/>
                                            <span className="mt-2 text-xs font-semibold text-primary">{item.label}</span>
                                        </Link>

                                        {
                                            hovered === item.id && (
                                                <div
                                                    className="absolute left-[-160px] top-1/2 -translate-y-1/2 bg-white px-6 py-2 rounded-lg shadow-lg text-sm text-gray-800 font-medium whitespace-nowrap select-none z-[100]"
                                                    style={{
                                                        minWidth: '140px'
                                                    }}>
                                                    {item.label}
                                                </div>
                                            )
                                        }
                                    </div>
                                ))
                            }

                            {/* 탑 버튼 (열렸을 때만) */}
                            <button
                                onClick={scrollToTop}
                                className="flex items-center cursor-pointer justify-center w-12 h-12 bg-white rounded-full shadow-md text-primary font-semibold mx-auto text-sm hover:bg-primary-100 transition select-none"
                                aria-label="페이지 상단으로 이동">
                                TOP
                            </button>
                        </div>
                    )
                }
            </div>

            {/* 숨김 상태에서 오른쪽에 화살표 버튼만 */}
            {
                !isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed top-1/2 -translate-y-1/2 right-6 z-50 flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md text-primary font-semibold text-sm hover:bg-primary-100 select-none hidden lg:flex"
                        aria-label="퀵메뉴 열기"
                        title="퀵메뉴 열기">
                        <FaChevronLeft className="w-6 h-6"/>
                    </button>
                )
            }

            {/* 모바일 하단 1열 메뉴 */}
            <div
                className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-1 bg-gray-100/90 px-2 py-2 shadow-lg backdrop-blur-sm select-none lg:hidden w-full justify-around">
                <Link
                    href="/"
                    className="flex flex-col items-center text-primary hover:text-primary select-none"
                    aria-label="홈으로 이동"
                    title="홈으로 이동">
                    <FaHouse className="w-5 h-5"/>
                    <span className="text-[10px] mt-0.5 whitespace-nowrap">홈</span>
                </Link>

                {
                    quickMenuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex flex-col items-center text-primary hover:text-primary select-none"
                            aria-label={item.label}
                            title={item.label}>
                            <item.icon className="w-5 h-5"/>
                            <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}
