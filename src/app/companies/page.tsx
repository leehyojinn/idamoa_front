import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createPageMetadata } from '@/lib/metadata'
import CompanySection from '@/components/company/CompanySection'
import { getCompanies } from '@/lib/api/company'

export const metadata = createPageMetadata({
  title: '업체찾기 - 인테리어 다모아',
  description: '다양한 인테리어 전문 업체들을 한곳에서 확인하세요. 지역별, 분야별로 원하는 업체를 찾아보세요.',
  path: '/companies',
  keywords: ['인테리어 업체', '업체찾기', '인테리어 회사', '리모델링 업체'],
})

export default async function CompanySearchPage() {
  // SSR: 서버에서 초기 데이터 로드 (SEO 최적화)
  let initialData = null
  try {
    const result = await getCompanies({ page: 0, size: 12, sort: 'createdAt,DESC' })
    initialData = result.data
  } catch (error) {
    console.error('업체 초기 로드 실패:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <CompanySection initialData={initialData || undefined} />
      </main>
      <Footer />
    </div>
  )
}
