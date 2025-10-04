// Camera management API client implementation
import type { Camera, StreamRequest, StreamResponse, PTZCommand } from '../../types/generated'

export class CameraApiClient {
  private baseUrl = 'http://localhost:8000'

  async getCameras(filters?: { status?: string; zone?: string }): Promise<Camera[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.zone) params.append('zone', filters.zone)

    const response = await fetch(`${this.baseUrl}/cameras?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch cameras')
    }

    return response.json()
  }

  async getCamera(cameraId: string): Promise<Camera> {
    const response = await fetch(`${this.baseUrl}/cameras/${cameraId}`, {
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch camera ${cameraId}`)
    }

    return response.json()
  }

  async startStream(cameraId: string, request: StreamRequest): Promise<StreamResponse> {
    const response = await fetch(`${this.baseUrl}/cameras/${cameraId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Failed to start stream for camera ${cameraId}`)
    }

    return response.json()
  }

  async controlPTZ(cameraId: string, command: PTZCommand): Promise<void> {
    const response = await fetch(`${this.baseUrl}/cameras/${cameraId}/ptz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
      body: JSON.stringify(command),
    })

    if (!response.ok) {
      throw new Error(`Failed to control PTZ for camera ${cameraId}`)
    }
  }

  async getSnapshot(cameraId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/cameras/${cameraId}/snapshot`, {
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get snapshot for camera ${cameraId}`)
    }

    return response.blob()
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken')
  }
}