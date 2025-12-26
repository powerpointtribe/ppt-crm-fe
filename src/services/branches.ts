import { apiService } from './api';
import { ApiResponse } from '@/types/api';
import { transformSingleResponse, transformArrayResponse } from '@/utils/apiResponseTransform';
import type {
  Branch,
  PublicBranch,
  CreateBranchData,
  UpdateBranchData,
  AssignPastorData,
} from '@/types/branch';

/**
 * Branches API Service
 * Handles all branch-related API calls for the multi-branch RBAC system
 */
export const branchesService = {
  /**
   * Get all branches (requires branches:view permission)
   */
  getBranches: async (): Promise<Branch[]> => {
    const response = await apiService.get<ApiResponse<Branch[]>>('/branches');
    return transformArrayResponse<Branch>(response);
  },

  /**
   * Get all active branches (public endpoint)
   * Used for public forms like visitor registration
   */
  getPublicBranches: async (): Promise<PublicBranch[]> => {
    const response = await apiService.get<ApiResponse<PublicBranch[]>>('/branches/public');
    return transformArrayResponse<PublicBranch>(response);
  },

  /**
   * Get a single branch by ID (requires branches:view-details permission)
   */
  getBranchById: async (id: string): Promise<Branch> => {
    const response = await apiService.get<ApiResponse<Branch>>(`/branches/${id}`);
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Get a branch by slug (public endpoint)
   * Used for branch-specific public forms
   */
  getBranchBySlug: async (slug: string): Promise<PublicBranch | null> => {
    try {
      const branches = await branchesService.getPublicBranches();
      return branches.find(b => b.slug === slug) || null;
    } catch (error) {
      console.error('Error fetching branch by slug:', error);
      return null;
    }
  },

  /**
   * Create a new branch (requires branches:create permission)
   */
  createBranch: async (data: CreateBranchData): Promise<Branch> => {
    const response = await apiService.post<ApiResponse<Branch>>('/branches', data);
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Update a branch (requires branches:update permission)
   */
  updateBranch: async (id: string, data: UpdateBranchData): Promise<Branch> => {
    const response = await apiService.patch<ApiResponse<Branch>>(`/branches/${id}`, data);
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Assign a branch pastor (requires branches:assign-pastor permission)
   */
  assignBranchPastor: async (branchId: string, data: AssignPastorData): Promise<Branch> => {
    const response = await apiService.patch<ApiResponse<Branch>>(
      `/branches/${branchId}/pastor`,
      data
    );
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Add an assistant pastor to a branch (requires branches:assign-pastor permission)
   */
  addAssistantPastor: async (branchId: string, data: AssignPastorData): Promise<Branch> => {
    const response = await apiService.post<ApiResponse<Branch>>(
      `/branches/${branchId}/assistant-pastors`,
      data
    );
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Remove an assistant pastor from a branch (requires branches:assign-pastor permission)
   */
  removeAssistantPastor: async (branchId: string, pastorId: string): Promise<Branch> => {
    const response = await apiService.delete<ApiResponse<Branch>>(
      `/branches/${branchId}/assistant-pastors/${pastorId}`
    );
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Deactivate a branch (requires branches:delete permission)
   * Note: This doesn't delete the branch, just marks it as inactive
   */
  deactivateBranch: async (id: string): Promise<Branch> => {
    const response = await apiService.delete<ApiResponse<Branch>>(`/branches/${id}`);
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Reactivate a branch (requires branches:update permission)
   */
  reactivateBranch: async (id: string): Promise<Branch> => {
    const response = await apiService.patch<ApiResponse<Branch>>(`/branches/${id}`, {
      isActive: true,
    });
    return transformSingleResponse<Branch>(response) as Branch;
  },

  /**
   * Generate a slug from a branch name
   * Utility function for creating URL-friendly branch identifiers
   */
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },

  /**
   * Validate a branch slug format
   */
  isValidSlug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  },
};

export default branchesService;
