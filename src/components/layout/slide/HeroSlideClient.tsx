'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

// Import component styles
import './HeroSlide.css';

interface Slide {
  id: number;
  bgColor: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  routerLink?: string[];
  buttonClick?: () => void;
  imageUrl: string;
}

export default function HeroSlideClient() {
  const swiperRef = useRef<SwiperType | null>(null);

  const baseSlides: Slide[] = [
    {
      id: 1,
      bgColor: 'from-emerald-500 to-emerald-600',
      title: '전문 플래너',
      subtitle: '다모아에서 시작하세요',
      description: '개원부터 리모델링까지\n병원 공간의 완벽한 솔루션',
      buttonText: '무료 상담 신청',
      routerLink: ['planner'],
      imageUrl: '/images/slide/new_slide_1.png',
    },
    {
      id: 2,
      bgColor: 'from-blue-500 to-blue-600',
      title: '검증된 전문 업체',
      subtitle: '믿을 수 있는 파트너',
      description: '철저한 검증을 거친\n병원 인테리어 전문 업체',
      buttonText: '업체 찾기',
      buttonClick: () => { scrollToFilter(); },
      imageUrl: '/images/slide/new_slide_2.png',
    },
    {
      id: 3,
      bgColor: 'from-purple-500 to-purple-600',
      title: '투명한 견적 비교',
      subtitle: '공개 입찰 시스템',
      description: '여러 업체 견적을 한번에\n투명하게 비교하세요',
      buttonText: '견적 의뢰하기',
      routerLink: ['estimates'],
      imageUrl: '/images/slide/new_slide_3.png',
    },
    {
      id: 4,
      bgColor: 'from-orange-500 to-orange-600',
      title: '평면도 설계툴',
      subtitle: '직접 도면 설계',
      description: '도면을 직접 조닝하여\n맞춤형 인테리어 계획 수립',
      buttonText: '평면도 설계툴',
      routerLink: ['mock-tools', 'floorplan-tool'],
      imageUrl: '/images/slide/new_slide_4.png',
    },
  ];

  // 슬라이드를 3번 복제하여 loop가 원활하게 작동하도록 함
  const slides = [
    ...baseSlides,
    ...baseSlides.map(s => ({ ...s, id: s.id + 4 })),
    ...baseSlides.map(s => ({ ...s, id: s.id + 8 })),
  ];

  const scrollToFilter = () => {
    const mainFilter = document.getElementById('main-filter');
    if (mainFilter) {
      const mainFilterTop = mainFilter.getBoundingClientRect().top;
      window.scrollTo({
        top: window.scrollY + mainFilterTop - 80,
        behavior: 'smooth'
      });
    }
  };

  const gotoPrevSlide = () => {
    swiperRef.current?.slidePrev();
  };

  const gotoNextSlide = () => {
    swiperRef.current?.slideNext();
  };

  return (
    <div className="hero-slider-container">
      <div className="w-full px-2 md:px-6 lg:px-8 pt-3">
        {/* 슬라이더 */}
        <div className="relative slider-wrapper">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            loop={true}
            slidesPerView={1.4}
            spaceBetween={20}
            centeredSlides={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            speed={800}
            breakpoints={{
              640: {
                slidesPerView: 1.5,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 1.7,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 2.2,
                spaceBetween: 30,
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={slide.id} className="py-3 sm:py-5 lg:py-12 md:py-12">
                <div className={`slide-card bg-gradient-to-br ${slide.bgColor}`}>
                  <div className="slide-content">
                    <div className="slide-text">
                      <h3 className="slide-subtitle">{slide.subtitle}</h3>
                      <h2 className="slide-title">{slide.title}</h2>
                      <p className="slide-description whitespace-pre-line">{slide.description}</p>
                      {slide.routerLink && (
                        <Link
                          href={'/' + slide.routerLink.join('/')}
                          className="slide-button"
                        >
                          {slide.buttonText}
                          <IoChevronForward className="size-5" />
                        </Link>
                      )}
                      {slide.buttonClick && (
                        <button
                          type="button"
                          onClick={slide.buttonClick}
                          className="slide-button"
                        >
                          {slide.buttonText}
                          <IoChevronForward className="size-5" />
                        </button>
                      )}
                    </div>
                    <div className="slide_img">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        width={600}
                        height={450}
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 40vw"
                        className="w-full h-full object-contain"
                        // 원본 슬라이드들(id 1-4)만 priority 로드 (LCP 최적화)
                        priority={slide.id <= 4}
                        // 나머지 복제본은 lazy load
                        loading={slide.id <= 4 ? 'eager' : 'lazy'}
                      />
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* 네비게이션 버튼 */}
          <button
            type="button"
            className="nav-button nav-button-prev"
            onClick={gotoPrevSlide}
            aria-label="이전 슬라이드"
          >
            <IoChevronBack className="size-6" />
          </button>

          <button
            type="button"
            className="nav-button nav-button-next"
            onClick={gotoNextSlide}
            aria-label="다음 슬라이드"
          >
            <IoChevronForward className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
