import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { membersService } from '../services/members-unified';
import type { Member, Role } from '../types';

interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  // Primary permission methods (strict permissions-based access)
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  // Legacy methods (kept for backward compatibility, but deprecated)
  canAccessModule: (module: string) => boolean;
  hasSystemRole: (role: string) => boolean;
  hasLeadershipRole: (role: 'district_pastor' | 'unit_head' | 'champ') => boolean;
  // Computed flags (derived from permissions)
  isGIA: boolean;
  isPastor: boolean;
  isAdmin: boolean;
  isLeader: boolean;
  canManageMembers: boolean;
  canAccessFirstTimers: boolean;
  canManageGroups: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuth };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize cached permissions synchronously
  const initCachedPermissions = () => {
    const cachedPerms = localStorage.getItem('cached_permissions');
    if (cachedPerms) {
      try {
        return JSON.parse(cachedPerms);
      } catch (e) {
        console.error('Failed to parse cached permissions:', e);
      }
    }
    return null;
  };

  // Initialize cached member synchronously
  const initCachedMember = (): Member | null => {
    const cachedMember = localStorage.getItem('cached_member');
    const hasToken = localStorage.getItem('auth_token');
    console.log('initCachedMember called:', {
      hasCachedMember: !!cachedMember,
      hasToken: !!hasToken
    });
    if (cachedMember) {
      try {
        const parsed = JSON.parse(cachedMember);
        console.log('Loaded cached member:', parsed?.email || parsed?.firstName);
        return parsed;
      } catch (e) {
        console.error('Failed to parse cached member:', e);
      }
    }
    return null;
  };

  const [member, setMember] = useState<Member | null>(() => {
    const cached = initCachedMember();
    console.log('Initial member state:', cached ? 'loaded from cache' : 'null');
    return cached;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [cachedPermissions, setCachedPermissions] = useState<{
    accessibleModules: string[];
    systemRoles: string[];
    permissions: string[]; // NEW: Cached permissions
    permissionsGrouped: Record<string, string[]>; // NEW: Cached grouped permissions
    role?: string;
  } | null>(initCachedPermissions);

  useEffect(() => {
    console.log('AuthProvider initialized with cached permissions:', cachedPermissions);
    console.log('Current localStorage cached_permissions:', localStorage.getItem('cached_permissions'));
    console.log('Current localStorage auth_token:', !!localStorage.getItem('auth_token'));
    checkAuthStatus();
  }, []);

  // Add a retry mechanism for when user comes back online
  useEffect(() => {
    const handleOnline = () => {
      const token = localStorage.getItem('auth_token');
      if (token && !member) {
        console.log('Network restored, attempting to restore user session');
        checkAuthStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [member]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Try to get user profile to validate token
      const memberProfile = await membersService.getProfile();

      // If profile is null/undefined, keep cached data and exit
      if (!memberProfile) {
        console.log('Profile API returned null, keeping cached member data');
        setIsLoading(false);
        return;
      }

      // Use permissions from profile response directly (backend now returns full permissions)
      const profilePermissions = memberProfile.permissions || [];
      const profileRole = memberProfile.role;

      // Build permissionsGrouped from flat permissions array
      const permissionsGrouped: Record<string, string[]> = {};
      for (const perm of profilePermissions) {
        const [module] = perm.split(':');
        if (!permissionsGrouped[module]) {
          permissionsGrouped[module] = [];
        }
        permissionsGrouped[module].push(perm);
      }

      // Set member with permissions from profile response
      const memberWithPermissions = {
        ...memberProfile,
        role: profileRole,
        permissions: profilePermissions,
        permissionsGrouped,
      };

      setMember(memberWithPermissions);
      localStorage.setItem('cached_member', JSON.stringify(memberWithPermissions));

      // Cache permissions for offline use
      const permissions = {
        accessibleModules: memberProfile.accessibleModules || [],
        systemRoles: memberProfile.systemRoles || [],
        permissions: profilePermissions,
        permissionsGrouped,
        role: profileRole?.name || profileRole
      };
      setCachedPermissions(permissions);
      localStorage.setItem('cached_permissions', JSON.stringify(permissions));

      console.log('Auth check successful, permissions loaded:', profilePermissions.length);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        status: error.status,
        response: error.response
      });

      // Only remove token for explicit 401 authentication errors
      // Be very specific to avoid false positives
      const isAuthError = error.code === 401 ||
                         error.code === '401' ||
                         error.status === 401 ||
                         error.response?.status === 401;

      const isNetworkError = error.code === 'NETWORK_ERROR' ||
                            error.message === 'Network Error' ||
                            error.code === 'ERR_NETWORK' ||
                            !navigator.onLine;

      if (isAuthError) {
        console.log('401 Authentication error detected, clearing token and permissions');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('cached_permissions');
        localStorage.removeItem('cached_member');
        setMember(null);
        setCachedPermissions(null);
      } else if (isNetworkError) {
        console.log('Network error detected, keeping cached user session');
        // For network errors, keep the cached member data - don't clear anything
      } else {
        console.log('Non-auth error occurred, keeping cached user session');
        // For other errors, keep the cached data - don't clear member
        // The cached member from initialization will remain
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await membersService.login({ email, password });
      localStorage.setItem('auth_token', response.access_token);

      // Handle both 'member' and 'user' properties from API response
      const memberData = response.member || (response as any).user;

      // Use permissions from login response directly (backend now returns full permissions)
      const loginPermissions = memberData.permissions || [];
      const loginRole = memberData.role;

      // Build permissionsGrouped from flat permissions array
      const permissionsGrouped: Record<string, string[]> = {};
      for (const perm of loginPermissions) {
        const [module] = perm.split(':');
        if (!permissionsGrouped[module]) {
          permissionsGrouped[module] = [];
        }
        permissionsGrouped[module].push(perm);
      }

      // Set member with permissions from login response
      const memberWithPermissions = {
        ...memberData,
        role: loginRole,
        permissions: loginPermissions,
        permissionsGrouped,
      };

      setMember(memberWithPermissions);
      localStorage.setItem('cached_member', JSON.stringify(memberWithPermissions));

      // Cache permissions for offline use
      const permissions = {
        accessibleModules: memberData.accessibleModules || [],
        systemRoles: memberData.systemRoles || [],
        permissions: loginPermissions,
        permissionsGrouped,
        role: loginRole?.name || loginRole
      };
      setCachedPermissions(permissions);
      localStorage.setItem('cached_permissions', JSON.stringify(permissions));

      console.log('Login successful, permissions loaded:', loginPermissions.length);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    throw new Error('Registration is disabled. Access is restricted to authorized PowerPoint Tribe leadership only.');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('cached_permissions');
    localStorage.removeItem('cached_member');
    setMember(null);
    setCachedPermissions(null);
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  // Access control helper methods

  /**
   * Check if user has a specific permission (e.g., 'members:create')
   */
  const hasPermission = (permission: string): boolean => {
    // Use current member permissions if available
    if (member?.permissions?.includes) {
      const has = member.permissions.includes(permission);
      console.log(`Permission check for '${permission}': ${has} (from member data)`);
      return has;
    }
    // Fallback to cached permissions during loading
    if (cachedPermissions?.permissions?.includes) {
      const has = cachedPermissions.permissions.includes(permission);
      console.log(`Permission check for '${permission}': ${has} (from cache)`);
      return has;
    }
    console.log(`Permission check for '${permission}': false (no permissions data)`);
    return false;
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  };

  /**
   * Check if user can access a module based on their permissions
   * Derives module access from permissions (e.g., if user has 'members:view', they can access 'members' module)
   */
  const canAccessModule = (module: string): boolean => {
    // Check if user has any permission for the module
    if (member?.permissionsGrouped?.[module]?.length > 0) {
      console.log(`Module access for '${module}': true (has ${member.permissionsGrouped[module].length} permissions)`);
      return true;
    }
    if (cachedPermissions?.permissionsGrouped?.[module]?.length > 0) {
      console.log(`Module access for '${module}': true (cached: ${cachedPermissions.permissionsGrouped[module].length} permissions)`);
      return true;
    }
    // Fallback to accessibleModules from backend if permissions not loaded
    if (member?.accessibleModules?.includes) {
      const hasAccess = member.accessibleModules.includes(module);
      console.log(`Module access for '${module}': ${hasAccess} (from accessibleModules)`);
      return hasAccess;
    }
    if (cachedPermissions?.accessibleModules?.includes) {
      const hasAccess = cachedPermissions.accessibleModules.includes(module);
      console.log(`Module access for '${module}': ${hasAccess} (from cached accessibleModules)`);
      return hasAccess;
    }
    console.log(`Module access for '${module}': false (no module data)`);
    return false;
  };

  const hasSystemRole = (role: string): boolean => {
    // Handle both array format and single role format
    if (member?.systemRoles?.includes) {
      return member.systemRoles.includes(role);
    }
    // Fallback to cached permissions during loading
    if (cachedPermissions?.systemRoles?.includes) {
      return cachedPermissions.systemRoles.includes(role);
    }
    // Check single role field from API or cached data
    return (member as any)?.role === role || cachedPermissions?.role === role || false;
  };

  const hasLeadershipRole = (role: 'district_pastor' | 'unit_head' | 'champ'): boolean => {
    if (!member?.leadershipRoles) {
      // Fallback: check if super_admin has leadership access
      return (member as any)?.role === 'super_admin' || false;
    }

    switch (role) {
      case 'district_pastor':
        return member.leadershipRoles.isDistrictPastor;
      case 'unit_head':
        return member.leadershipRoles.isUnitHead;
      case 'champ':
        return member.leadershipRoles.isChamp;
      default:
        return false;
    }
  };

  // Computed properties derived from PERMISSIONS (strict permissions-based)
  const isGIA = member?.unitType === 'gia' || false;

  // Admin check: has roles:view permission (indicates admin-level access)
  const isAdmin = hasPermission('roles:view') || hasPermission('roles:create');

  // Pastor check: can manage members and first-timers
  const isPastor = hasPermission('members:create') && hasPermission('first-timers:view');

  // Leader check: can manage any group/unit
  const isLeader = hasPermission('units:update') || hasPermission('units:create');

  // More comprehensive authentication check
  const hasToken = !!localStorage.getItem('auth_token');
  const isAuthenticated = !!member || (hasToken && !!cachedPermissions);

  // Module-specific access checks (derived from permissions)
  const canManageMembers = hasPermission('members:view');
  const canAccessFirstTimers = hasPermission('first-timers:view');
  const canManageGroups = hasPermission('units:view');

  const value: AuthContextType = {
    member,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    hasSystemRole,
    hasLeadershipRole,
    isGIA,
    isPastor,
    isAdmin,
    isLeader,
    canManageMembers,
    canAccessFirstTimers,
    canManageGroups,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};