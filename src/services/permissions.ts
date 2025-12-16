import { apiService } from './api'

export interface UserPermissionsResponse {
  role: {
    id: string
    name: string
    displayName: string
    level: number
  }
  permissions: string[] // Flat array of permission names (e.g., ['members:create', 'members:view'])
  permissionsGrouped: Record<string, string[]> // Grouped by module
}

class PermissionsService {
  /**
   * Get current user's permissions
   */
  async getUserPermissions(): Promise<UserPermissionsResponse> {
    return await apiService.get<UserPermissionsResponse>('/user-permissions/me')
  }

  /**
   * Get accessible modules for current user
   */
  async getAccessibleModules(): Promise<string[]> {
    return await apiService.get<string[]>('/user-permissions/me/modules')
  }

  /**
   * Check if user has a specific permission
   */
  async checkPermission(permission: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ hasPermission: boolean }>(`/user-permissions/me/check/${permission}`)
      return response.hasPermission
    } catch (error) {
      console.error(`Failed to check permission '${permission}':`, error)
      return false
    }
  }
}

export const permissionsService = new PermissionsService()
