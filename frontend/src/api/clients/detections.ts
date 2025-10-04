// Detection events API client implementation
import type { Detection, Alarm, Track } from '../../types/generated'

export class DetectionApiClient {
  private baseUrl = 'http://localhost:8000'

  async getDetections(params?: {
    cameraId?: string
    type?: string
    startTime?: string
    endTime?: string
    limit?: number
    offset?: number
  }): Promise<Detection[]> {
    const searchParams = new URLSearchParams()
    if (params?.cameraId) searchParams.append('cameraId', params.cameraId)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.startTime) searchParams.append('startTime', params.startTime)
    if (params?.endTime) searchParams.append('endTime', params.endTime)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetch(`${this.baseUrl}/detections?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch detections')
    }

    return response.json()
  }

  async getDetection(detectionId: string): Promise<Detection> {
    const response = await fetch(`${this.baseUrl}/detections/${detectionId}`, {
      headers: {
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch detection ${detectionId}`)
    }

    return response.json()
  }

  async getAlarms(params?: {
    type?: string
    severity?: string
    acknowledged?: boolean
    limit?: number
    offset?: number
  }): Promise<Alarm[]> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.append('type', params.type)
    if (params?.severity) searchParams.append('severity', params.severity)
    if (params?.acknowledged !== undefined)
      searchParams.append('acknowledged', params.acknowledged.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const response = await fetch(`${this.baseUrl}/alarms?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch alarms')
    }

    return response.json()
  }

  async acknowledgeAlarm(alarmId: string, acknowledgedBy: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alarms/${alarmId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
      body: JSON.stringify({ acknowledgedBy }),
    })

    if (!response.ok) {
      throw new Error(`Failed to acknowledge alarm ${alarmId}`)
    }
  }

  async getTracks(params?: {
    cameraId?: string
    startTime?: string
    endTime?: string
    active?: boolean
  }): Promise<Track[]> {
    const searchParams = new URLSearchParams()
    if (params?.cameraId) searchParams.append('cameraId', params.cameraId)
    if (params?.startTime) searchParams.append('startTime', params.startTime)
    if (params?.endTime) searchParams.append('endTime', params.endTime)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())

    const response = await fetch(`${this.baseUrl}/tracks?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tracks')
    }

    return response.json()
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken')
  }
}
