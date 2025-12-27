import { apiService } from './api';

export interface UserInvitation {
  _id: string;
  member: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  role: {
    _id: string;
    name: string;
    displayName: string;
  };
  branch: {
    _id: string;
    name: string;
    slug: string;
  };
  assignedDistricts?: Array<{
    _id: string;
    name: string;
  }>;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invitedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  expiresAt: string;
  emailSent: boolean;
  emailSentAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  resendCount: number;
  lastResentAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationData {
  memberId: string;
  roleId: string;
  branchId: string; // Required for RBAC - user will be scoped to this branch
  assignedDistricts?: string[]; // For Assistant Pastors - districts they can manage
  notes?: string;
}

export interface RevokeInvitationData {
  reason?: string;
}

export interface UpdateInvitationRoleData {
  roleId: string;
  notes?: string;
}

export interface InvitationStatistics {
  total: number;
  pending: number;
  accepted: number;
  revoked: number;
  expired: number;
}

export interface InvitationQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'accepted' | 'revoked' | 'expired';
  memberId?: string;
  roleId?: string;
  invitedBy?: string;
  branchId?: string;
}

export interface ActiveUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role?: {
    _id: string;
    name: string;
    displayName: string;
  };
  lastLogin?: string;
}

export interface UpdateUserRoleData {
  roleId: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const userInvitationsService = {
  // Invitation Management
  async createInvitation(data: CreateInvitationData): Promise<UserInvitation> {
    const response = await apiService.post<{ success: boolean; message: string; data: UserInvitation }>(
      '/user-invitations',
      data
    );
    return response.data.data;
  },

  async getInvitations(params?: InvitationQueryParams): Promise<PaginatedResponse<UserInvitation>> {
    const response = await apiService.get<PaginatedResponse<UserInvitation>>(
      '/user-invitations',
      { params }
    );
    return response;
  },

  async getInvitationById(id: string): Promise<UserInvitation> {
    const response = await apiService.get<{ success: boolean; message: string; data: UserInvitation }>(
      `/user-invitations/${id}`
    );
    return response.data.data;
  },

  async resendInvitation(id: string): Promise<UserInvitation> {
    const response = await apiService.post<{ success: boolean; message: string; data: UserInvitation }>(
      `/user-invitations/${id}/resend`
    );
    return response.data.data;
  },

  async revokeInvitation(id: string, data?: RevokeInvitationData): Promise<UserInvitation> {
    const response = await apiService.patch<{ success: boolean; message: string; data: UserInvitation }>(
      `/user-invitations/${id}/revoke`,
      data
    );
    return response.data.data;
  },

  async updateInvitationRole(id: string, data: UpdateInvitationRoleData): Promise<UserInvitation> {
    const response = await apiService.patch<{ success: boolean; message: string; data: UserInvitation }>(
      `/user-invitations/${id}/role`,
      data
    );
    return response.data.data;
  },

  async getStatistics(): Promise<InvitationStatistics> {
    const response = await apiService.get<{ success: boolean; message: string; data: InvitationStatistics }>(
      '/user-invitations/statistics'
    );
    return response.data.data;
  },

  // User Access Management
  async getActiveUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: string;
  }): Promise<PaginatedResponse<ActiveUser>> {
    const response = await apiService.get<PaginatedResponse<ActiveUser>>(
      '/user-invitations/users/active',
      { params }
    );
    return response;
  },

  async updateUserRole(memberId: string, data: UpdateUserRoleData): Promise<ActiveUser> {
    const response = await apiService.patch<{ success: boolean; message: string; data: ActiveUser }>(
      `/user-invitations/users/${memberId}/role`,
      data
    );
    return response.data.data;
  },

  async deactivateUser(memberId: string): Promise<ActiveUser> {
    const response = await apiService.patch<{ success: boolean; message: string; data: ActiveUser }>(
      `/user-invitations/users/${memberId}/deactivate`
    );
    return response.data.data;
  },

  async activateUser(memberId: string): Promise<ActiveUser> {
    const response = await apiService.patch<{ success: boolean; message: string; data: ActiveUser }>(
      `/user-invitations/users/${memberId}/activate`
    );
    return response.data.data;
  },

  async deleteUserAccess(memberId: string): Promise<ActiveUser> {
    const response = await apiService.delete<{ success: boolean; message: string; data: ActiveUser }>(
      `/user-invitations/users/${memberId}/access`
    );
    return response.data.data;
  },
};

export default userInvitationsService;
