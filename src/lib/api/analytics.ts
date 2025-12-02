/**
 * Analytics API
 */

import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/types/api'

// ========================================
// Types & Interfaces
// ========================================

export interface DailyTrafficData {
  date: string
  activeUsers: number
  sessions: number
  screenPageViews: number
}

export interface PageViewData {
  pagePath: string
  pageTitle: string
  screenPageViews: number
  averageTimeOnPage: number
}

export interface DeviceStatsData {
  deviceCategory: string
  sessions: number
  activeUsers: number
  bounceRate: number
}

export interface LocationStatsData {
  country: string
  city: string
  sessions: number
  activeUsers: number
}

export interface AcquisitionChannelData {
  source: string
  medium: string
  sessions: number
  newUsers: number
  engagementRate: number
}

export interface SummaryStatsData {
  activeUsers: number
  sessions: number
  screenPageViews: number
  bounceRate: number
  engagementRate: number
  avgSessionDuration: number
}

export interface RealtimeUsersData {
  activeUsers: number
}

export interface EventCountData {
  eventName: string
  eventCount: number
}

export interface BrowserStatsData {
  browser: string
  sessions: number
  activeUsers: number
}

export interface EngagementMetricsData {
  bounceRate: number
  engagementRate: number
  avgSessionDuration: number
  pageViewsPerSession: number
}

export interface ComparisonStatsData {
  current: SummaryStatsData
  previous: SummaryStatsData
  changes: {
    activeUsersChange: number
    sessionsChange: number
    pageViewsChange: number
    bounceRateChange: number
    engagementRateChange: number
    avgSessionDurationChange: number
  }
}

// ========================================
// API Functions
// ========================================

/**
 * 일별 트래픽 조회
 */
export const getDailyTraffic = async (params: {
  startDateStr: string
  endDateStr: string
}): Promise<ApiResponse<DailyTrafficData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/daily-traffic', { params })
  return response.data
}

/**
 * 페이지별 조회수 조회
 */
export const getPageViews = async (params: {
  startDateStr: string
  endDateStr: string
  limit?: number
}): Promise<ApiResponse<PageViewData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/page-views', { params })
  return response.data
}

/**
 * 특정 페이지 통계 조회
 */
export const getPageStats = async (params: {
  pagePath: string
  startDateStr: string
  endDateStr: string
}): Promise<ApiResponse<PageViewData>> => {
  const response = await axiosInstance.get('/admin/analytics/page-stats', { params })
  return response.data
}

/**
 * 실시간 활성 사용자 조회
 */
export const getRealtimeUsers = async (): Promise<ApiResponse<RealtimeUsersData>> => {
  const response = await axiosInstance.get('/admin/analytics/realtime-users')
  return response.data
}

/**
 * 요약 통계 조회
 */
export const getSummaryStats = async (params: {
  startDateStr: string
  endDateStr: string
}): Promise<ApiResponse<SummaryStatsData>> => {
  const response = await axiosInstance.get('/admin/analytics/summary', { params })
  return response.data
}

/**
 * 이벤트별 카운트 조회
 */
export const getEventCounts = async (params: {
  startDateStr: string
  endDateStr: string
  limit?: number
}): Promise<ApiResponse<EventCountData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/event-counts', { params })
  return response.data
}

/**
 * 사용자 획득 채널 조회
 */
export const getAcquisitionChannels = async (params: {
  startDateStr: string
  endDateStr: string
  limit?: number
}): Promise<ApiResponse<AcquisitionChannelData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/acquisition-channels', { params })
  return response.data
}

/**
 * 기기별 통계 조회
 */
export const getDeviceStats = async (params: {
  startDateStr: string
  endDateStr: string
}): Promise<ApiResponse<DeviceStatsData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/device-stats', { params })
  return response.data
}

/**
 * 지역별 통계 조회
 */
export const getLocationStats = async (params: {
  startDateStr: string
  endDateStr: string
  limit?: number
}): Promise<ApiResponse<LocationStatsData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/location-stats', { params })
  return response.data
}

/**
 * 브라우저별 통계 조회
 */
export const getBrowserStats = async (params: {
  startDateStr: string
  endDateStr: string
  limit?: number
}): Promise<ApiResponse<BrowserStatsData[]>> => {
  const response = await axiosInstance.get('/admin/analytics/browser-stats', { params })
  return response.data
}

/**
 * 참여도 지표 조회
 */
export const getEngagementMetrics = async (params: {
  startDateStr: string
  endDateStr: string
}): Promise<ApiResponse<EngagementMetricsData>> => {
  const response = await axiosInstance.get('/admin/analytics/engagement-metrics', { params })
  return response.data
}

/**
 * 기간 비교 통계 조회
 */
export const getComparisonStats = async (params: {
  currentStart: string
  currentEnd: string
  previousStart: string
  previousEnd: string
}): Promise<ApiResponse<ComparisonStatsData>> => {
  const response = await axiosInstance.get('/admin/analytics/comparison-stats', { params })
  return response.data
}
