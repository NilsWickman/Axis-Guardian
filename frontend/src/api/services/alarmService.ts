/**
 * Alarm API Service
 * Handles all alarm-related API calls with mock mode support
 */

import { httpClient, type HttpClient } from '../client/httpClient'
import type { Alarm, AlarmSeverity, AlarmStatus } from '@/types/generated'
import { mockAlarms, acknowledgeMockAlarm } from '@/mocks/data'

export interface AlarmFilters {
  severity?: AlarmSeverity
  acknowledged?: boolean
  status?: AlarmStatus
  cameraId?: string
  zoneId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AlarmAcknowledgeRequest {
  acknowledgedBy: string
}

export interface AlarmConfirmRequest {
  confirmedBy: string
  notes?: string
  outcomeCategory?: string
  createIncident?: boolean
}

export interface AlarmDismissRequest {
  dismissedBy: string
  reason: string
  outcomeCategory?: string
  notes?: string
}

export class AlarmService {
  constructor(private client: HttpClient = httpClient) {}

  /**
   * Get all alarms with optional filters
   */
  async getAlarms(filters?: AlarmFilters): Promise<Alarm[]> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      let result = [...mockAlarms]

      // Apply filters
      if (filters?.severity) {
        result = result.filter((a) => a.severity === filters.severity)
      }
      if (filters?.acknowledged !== undefined) {
        result = result.filter((a) => a.acknowledged === filters.acknowledged)
      }
      if (filters?.status) {
        result = result.filter((a) => a.status === filters.status)
      }
      if (filters?.cameraId) {
        result = result.filter((a) => a.source.cameraId === filters.cameraId)
      }
      if (filters?.zoneId) {
        result = result.filter((a) => a.source.zoneId === filters.zoneId)
      }
      if (filters?.startDate) {
        const start = new Date(filters.startDate).getTime()
        result = result.filter((a) => new Date(a.timestamp).getTime() >= start)
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate).getTime()
        result = result.filter((a) => new Date(a.timestamp).getTime() <= end)
      }

      // Apply pagination
      if (filters?.offset !== undefined) {
        result = result.slice(filters.offset)
      }
      if (filters?.limit !== undefined) {
        result = result.slice(0, filters.limit)
      }

      return result
    }

    return this.client.get<Alarm[]>('/alarms', {
      params: filters as any,
    })
  }

  /**
   * Get alarm by ID
   */
  async getAlarm(id: string): Promise<Alarm> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) {
        throw new Error(`Alarm not found: ${id}`)
      }
      return { ...alarm }
    }

    return this.client.get<Alarm>(`/alarms/${id}`)
  }

  /**
   * Acknowledge alarm
   */
  async acknowledgeAlarm(id: string, data: AlarmAcknowledgeRequest): Promise<Alarm> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) {
        throw new Error(`Alarm not found: ${id}`)
      }
      alarm.acknowledged = true
      alarm.acknowledgedBy = data.acknowledgedBy
      alarm.acknowledgedAt = new Date().toISOString()
      if (alarm.status === 'pending') {
        alarm.status = 'acknowledged'
      }
      acknowledgeMockAlarm(id, data.acknowledgedBy)
      return { ...alarm }
    }

    return this.client.post<Alarm>(`/alarms/${id}/acknowledge`, data)
  }

  /**
   * Confirm alarm (after acknowledgement)
   */
  async confirmAlarm(id: string, data: AlarmConfirmRequest): Promise<Alarm> {
    if (this.client.isMockMode()) {
      await this.delay(300)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) {
        throw new Error(`Alarm not found: ${id}`)
      }
      alarm.confirmedBy = data.confirmedBy
      alarm.confirmedAt = new Date().toISOString()
      alarm.status = 'confirmed'
      if (data.notes) {
        alarm.closureNotes = data.notes
      }
      if (data.outcomeCategory) {
        alarm.outcomeCategory = data.outcomeCategory as any
      }
      if (data.createIncident) {
        alarm.incidentId = `incident-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 1000)}`
      }
      return { ...alarm }
    }

    return this.client.post<Alarm>(`/alarms/${id}/confirm`, data)
  }

  /**
   * Dismiss alarm
   */
  async dismissAlarm(id: string, data: AlarmDismissRequest): Promise<Alarm> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (!alarm) {
        throw new Error(`Alarm not found: ${id}`)
      }
      alarm.dismissedBy = data.dismissedBy
      alarm.dismissedAt = new Date().toISOString()
      alarm.dismissalReason = data.reason
      alarm.status = 'dismissed'
      if (data.outcomeCategory) {
        alarm.outcomeCategory = data.outcomeCategory as any
      }
      if (data.notes) {
        alarm.closureNotes = data.notes
      }
      return { ...alarm }
    }

    return this.client.post<Alarm>(`/alarms/${id}/dismiss`, data)
  }

  /**
   * Archive alarm
   */
  async archiveAlarm(id: string): Promise<void> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const alarm = mockAlarms.find((a) => a.id === id)
      if (alarm) {
        alarm.status = 'archived'
      }
      return
    }

    return this.client.post(`/alarms/${id}/archive`)
  }

  /**
   * Delete alarm
   */
  async deleteAlarm(id: string): Promise<void> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      const index = mockAlarms.findIndex((a) => a.id === id)
      if (index !== -1) {
        mockAlarms.splice(index, 1)
      }
      return
    }

    return this.client.delete(`/alarms/${id}`)
  }

  /**
   * Get alarm statistics
   */
  async getAlarmStats(filters?: { startDate?: string; endDate?: string }): Promise<{
    total: number
    bySeverity: Record<AlarmSeverity, number>
    byStatus: Record<string, number>
  }> {
    if (this.client.isMockMode()) {
      await this.delay(200)
      let alarms = [...mockAlarms]

      if (filters?.startDate) {
        const start = new Date(filters.startDate).getTime()
        alarms = alarms.filter((a) => new Date(a.timestamp).getTime() >= start)
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate).getTime()
        alarms = alarms.filter((a) => new Date(a.timestamp).getTime() <= end)
      }

      const bySeverity = {
        low: alarms.filter((a) => a.severity === 'low').length,
        medium: alarms.filter((a) => a.severity === 'medium').length,
        high: alarms.filter((a) => a.severity === 'high').length,
        critical: alarms.filter((a) => a.severity === 'critical').length,
      }

      const byStatus: Record<string, number> = {}
      alarms.forEach((a) => {
        const status = a.status || 'unknown'
        byStatus[status] = (byStatus[status] || 0) + 1
      })

      return {
        total: alarms.length,
        bySeverity,
        byStatus,
      }
    }

    return this.client.get('/alarms/stats', {
      params: filters as any,
    })
  }

  /**
   * Helper: Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const alarmService = new AlarmService()
