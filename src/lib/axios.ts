import axios from 'axios'

/**
 * Axios 인스턴스 설정
 * 기본 URL과 공통 설정을 미리 정의
 */

const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;

const axiosInstance = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 요청 인터셉터
 * 모든 요청 전에 실행됩니다
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('📤 요청:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ 요청 에러:', error)
    return Promise.reject(error)
  }
)

/**
 * 응답 인터셉터
 * 모든 응답 후에 실행됩니다
 */
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 응답:', response.status, response.config.url)
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러 && 아직 재시도 안했으면 토큰 갱신
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // Refresh Token으로 새 Access Token 발급
        const response = await axios.post(`${apiBaseUrl}/api/auth/refresh`, {
          refreshToken
        })

        const newAccessToken = response.data.data.accessToken
        const newRefreshToken = response.data.data.refreshToken

        // 새 토큰 저장
        localStorage.setItem('accessToken', newAccessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }

        // 실패했던 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh Token도 만료됨 → 로그아웃 처리
        console.error('토큰 갱신 실패:', refreshError)
        localStorage.clear()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // 에러 처리
    if (error.response) {
      // 서버가 응답했지만 에러 상태 코드
      console.error('❌ 응답 에러:', error.response.status, error.response.data)
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함
      console.error('❌ 응답 없음:', error.request)
    } else {
      // 요청 설정 중 에러 발생
      console.error('❌ 요청 설정 에러:', error.message)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
