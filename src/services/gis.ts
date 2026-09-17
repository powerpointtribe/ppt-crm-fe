import { apiService } from './api'
import type {
  GisDashboard,
  GisSnapshot,
  GisDistrictView,
  GisUnitView,
  GisDirectorateView,
  GisMemberJourney,
} from '@/types/gis'

class GisService {
  async getDashboard(filters?: { branch?: string; date?: string }): Promise<GisDashboard> {
    const params: Record<string, string> = {}
    if (filters?.branch) params.branch = filters.branch
    if (filters?.date) params.date = filters.date
    const response = await apiService.get<{ data: GisDashboard }>('/gis/dashboard', {
      params: Object.keys(params).length ? params : undefined,
    })
    return (response as any).data
  }

  async getTrends(
    months = 6,
    period: 'weekly' | 'monthly' = 'weekly',
    branch?: string,
  ): Promise<GisSnapshot[]> {
    const params: Record<string, string> = { months: String(months), period }
    if (branch) params.branch = branch
    const response = await apiService.get<{ data: GisSnapshot[] }>('/gis/trends', { params })
    return (response as any).data
  }

  async getDistrictView(districtId: string): Promise<GisDistrictView> {
    const response = await apiService.get<{ data: GisDistrictView }>(`/gis/district/${districtId}`)
    return (response as any).data
  }

  async getDirectorateView(directorateId: string): Promise<GisDirectorateView> {
    const response = await apiService.get<{ data: GisDirectorateView }>(
      `/gis/directorate/${directorateId}`,
    )
    return (response as any).data
  }

  async getUnitView(unitId: string): Promise<GisUnitView> {
    const response = await apiService.get<{ data: GisUnitView }>(`/gis/unit/${unitId}`)
    return (response as any).data
  }

  async getMemberJourney(memberId: string): Promise<GisMemberJourney> {
    const response = await apiService.get<{ data: GisMemberJourney }>(
      `/gis/member/${memberId}/journey`,
    )
    return (response as any).data
  }

  async triggerSnapshot(): Promise<void> {
    await apiService.post('/gis/snapshot')
  }
}

export const gisService = new GisService()
