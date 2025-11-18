import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '견적 계산기 - 다모아',
  description: '인테리어 공사 견적을 쉽고 빠르게 계산해보세요',
  keywords: '인테리어 견적, 견적 계산기, 공사 비용, 리모델링 견적',
}

export default function EstimateCalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
