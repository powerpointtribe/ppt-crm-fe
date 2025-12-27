import { apiService } from './api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export type MembershipStatusTag = 'MEMBER' | 'DC' | 'LXL' | 'DIRECTOR' | 'PASTOR' | 'CAMPUS_PASTOR' | 'SENIOR_PASTOR' | 'LEFT'

export interface Role {
  _id: string
  name: string
  slug: string
  displayName: string
  description?: string
  permissions: string[] | Permission[] // Array of Permission IDs or populated Permission objects
  parentRole?: string
  level: number
  isSystemRole: boolean
  isActive: boolean
  colorCode?: string
  membershipStatusTag?: MembershipStatusTag // When this role is assigned, member's membershipStatus is updated to this value
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Permission {
  _id: string
  name: string // e.g., 'members:create'
  displayName: string
  description?: string
  module: string
  resource: string
  action: string
  endpoint?: {
    path: string
    method: string
  }
  isActive: boolean
  isPublic: boolean
  metadata?: Record<string, any>
}

export interface CreateRoleDto {
  name: string
  slug: string
  displayName: string
  description?: string
  parentRole?: string
  level?: number
  colorCode?: string
  membershipStatusTag?: MembershipStatusTag
  metadata?: Record<string, any>
}

export interface UpdateRoleDto {
  name?: string
  slug?: string
  displayName?: string
  description?: string
  parentRole?: string
  level?: number
  isActive?: boolean
  colorCode?: string
  membershipStatusTag?: MembershipStatusTag
  metadata?: Record<string, any>
}

export interface AssignPermissionsDto {
  permissionIds: string[]
}

export interface RoleWithPermissions extends Omit<Role, 'permissions'> {
  permissions: Permission[] // Populated permissions
}

class RolesService {
  /**
   * Get all roles
   */
  async getRoles(filters?: {
    isActive?: boolean
    isSystemRole?: boolean
    search?: string
  }): Promise<Role[]> {
    const params = new URLSearchParams()
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
    if (filters?.isSystemRole !== undefined) params.append('isSystemRole', String(filters.isSystemRole))
    if (filters?.search) params.append('search', filters.search)

    const response = await apiService.get<ApiResponse<Role[]> | Role[]>(`/roles?${params.toString()}`)
    // Handle both wrapped and unwrapped responses
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data
    }
    return response as Role[]
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string, populatePermissions = true): Promise<RoleWithPermissions> {
    return await apiService.get<RoleWithPermissions>(`/roles/${id}?populate=${populatePermissions}`)
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(id: string): Promise<Permission[]> {
    return await apiService.get<Permission[]>(`/roles/${id}/permissions`)
  }

  /**
   * Create new role
   */
  async createRole(data: CreateRoleDto): Promise<Role> {
    return await apiService.post<Role>('/roles', data)
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    return await apiService.patch<Role>(`/roles/${id}`, data)
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    await apiService.delete(`/roles/${id}`)
  }

  /**
   * Assign permissions to role (replaces all existing permissions)
   */
  async assignPermissions(id: string, permissionIds: string[]): Promise<Role> {
    return await apiService.post<Role>(`/roles/${id}/permissions/assign`, { permissionIds })
  }

  /**
   * Add permissions to role (without replacing existing)
   */
  async addPermissions(id: string, permissionIds: string[]): Promise<Role> {
    return await apiService.post<Role>(`/roles/${id}/permissions/add`, { permissionIds })
  }

  /**
   * Remove permissions from role
   */
  async removePermissions(id: string, permissionIds: string[]): Promise<Role> {
    return await apiService.post<Role>(`/roles/${id}/permissions/remove`, { permissionIds })
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(filters?: {
    module?: string
    resource?: string
    action?: string
    isActive?: boolean
    isPublic?: boolean
  }): Promise<Permission[]> {
    const params = new URLSearchParams()
    if (filters?.module) params.append('module', filters.module)
    if (filters?.resource) params.append('resource', filters.resource)
    if (filters?.action) params.append('action', filters.action)
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))

    return await apiService.get<Permission[]>(`/permissions?${params.toString()}`)
  }

  /**
   * Get permissions grouped by module
   */
  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    return await apiService.get<Record<string, Permission[]>>('/permissions/by-module')
  }

  /**
   * Assign role to a member
   */
  async assignRoleToMember(memberId: string, roleId: string): Promise<void> {
    await apiService.patch(`/members/${memberId}/role`, { roleId })
  }
}

export const rolesService = new RolesService()
