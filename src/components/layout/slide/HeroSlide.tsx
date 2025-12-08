'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { IoChevronForward } from 'react-icons/io5';
import './HeroSlide.css';

// Dynamic import로 Swiper 컴포넌트를 지연 로드 (LCP 최적화)
const HeroSlideClient = dynamic(() => import('./HeroSlideClient'), {
  ssr: false,
  loading: () => <HeroSlideFallback />,
});

// 첫 번째 슬라이드를 표시하는 fallback 컴포넌트 (LCP 최적화)
function HeroSlideFallback() {
  return (
    <div className="hero-slider-container">
      <div className="w-full px-2 md:px-6 lg:px-8 pt-3">
        <div className="relative slider-wrapper">
          <div className="py-3 sm:py-5 lg:py-12 md:py-12">
            <div className="slide-card bg-gradient-to-br from-emerald-500 to-emerald-600">
              <div className="slide-content">
                <div className="slide-text">
                  <h3 className="slide-subtitle">다모아에서 시작하세요</h3>
                  <h2 className="slide-title">전문 플래너</h2>
                  <p className="slide-description whitespace-pre-line">
                    개원부터 리모델링까지{'\n'}완벽한 공간 솔루션
                  </p>
                  <Link href="/planner" className="slide-button">
                    무료 상담 신청
                    <IoChevronForward className="size-5" />
                  </Link>
                </div>
                <div className="slide_img">
                  <Image
                    src="/images/slide/new_slide_1.png"
                    alt="전문 플래너"
                    width={600}
                    height={450}
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 40vw"
                    className="w-full h-full object-contain"
                    priority
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlide() {
  return <HeroSlideClient />;
}
