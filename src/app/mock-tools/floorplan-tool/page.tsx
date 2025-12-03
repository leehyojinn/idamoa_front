'use client'
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import React, {useEffect} from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
    const router = useRouter()

    useEffect(() => {
        // 페이지 접근 시 홈으로 리다이렉트
        router.push('/')
    }, [router])

    useEffect(() => {
        if (window.innerWidth < 550) {
            let meta = document.querySelector('meta[name="viewport"]')as HTMLMetaElement | null
            if (meta) {
                meta.setAttribute('content', 'width=1024')
            } else {
                meta = document.createElement('meta')as HTMLMetaElement
                meta.name = 'viewport'
                meta.content = 'width=1024'
                document
                    .head
                    .appendChild(meta)
            }
        }
    }, []);

    return (
        <div>
            <Navbar/>
            <div
                style={{
                    width: '100%',
                    maxWidth: '2560px',
                    margin: '0 auto',
                    height: '100vh',
                    minHeight: '600px',
                    boxSizing: 'border-box'
                }}>
                <iframe
                    src="/editor/editor.html"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block'
                    }}
                    title="와플레이스 평면도 설계 툴"/>
            </div>
            <Footer/>
        </div>
    )
}
