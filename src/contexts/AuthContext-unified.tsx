import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { membersService } from '@/services/members-unified';

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  systemRoles: string[];
  unitType?: string;
  membershipStatus: string;
  district?: any;
  unit?: any;
  accessibleModules: string[];
  leadershipRoles: {
    isDistrictPastor: boolean;
    isUnitHead: boolean;
    isChamp: boolean;
    pastorsDistrict?: string;
    leadsUnit?: string;
    champForDistrict?: string;
  };
}

interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  canAccessModule: (module: string) => boolean;
  hasSystemRole: (role: string) => boolean;
  hasLeadershipRole: (role: 'district_pastor' | 'unit_head' | 'champ') => boolean;
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

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedPermissions, setCachedPermissions] = useState<{
    accessibleModules: string[];
    systemRoles: string[];
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
      setMember(memberProfile);

      // Cache permissions for offline use
      const permissions = {
        accessibleModules: memberProfile.accessibleModules || [],
        systemRoles: memberProfile.systemRoles || [],
        role: (memberProfile as any)?.role
      };
      setCachedPermissions(permissions);
      localStorage.setItem('cached_permissions', JSON.stringify(permissions));
    } catch (error: any) {
      console.error('Auth check failed:', error);

      // Only remove token for authentication errors, not network errors
      const isAuthError = error.code === 401 ||
                         error.code === 'UNAUTHORIZED' ||
                         error.message?.includes('401') ||
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('invalid token') ||
                         error.message?.includes('expired');

      const isNetworkError = error.code === 'NETWORK_ERROR' ||
                            error.message === 'Network Error' ||
                            error.code === 'ERR_NETWORK' ||
                            !navigator.onLine;

      if (isAuthError) {
        console.log('Authentication error detected, clearing token and permissions');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('cached_permissions');
        setMember(null);
        setCachedPermissions(null);
      } else if (isNetworkError) {
        console.log('Network error detected, keeping token and user session');
        // For network errors, try to preserve the session by keeping existing member data
        // We'll keep the user logged in but they might see cached data
      } else {
        console.log('Unknown error, keeping token but clearing member data temporarily');
        // For other errors, keep token but clear member data
        // This allows for retry on next page load
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
      setMember(memberData);
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
    setMember(null);
    setCachedPermissions(null);
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  // Access control helper methods
  const canAccessModule = (module: string): boolean => {
    // Use current member data if available
    if (member?.accessibleModules?.includes) {
      const hasAccess = member.accessibleModules.includes(module);
      console.log(`Permission check for module '${module}': ${hasAccess} (from current member data)`);
      return hasAccess;
    }
    // Fallback to cached permissions during loading
    if (cachedPermissions?.accessibleModules?.includes) {
      const hasAccess = cachedPermissions.accessibleModules.includes(module);
      console.log(`Permission check for module '${module}': ${hasAccess} (from cached permissions)`);
      return hasAccess;
    }
    // Allow super_admin access to all modules
    const isSuperAdmin = (member as any)?.role === 'super_admin' || cachedPermissions?.role === 'super_admin';
    console.log(`Permission check for module '${module}': ${isSuperAdmin} (super_admin access)`);
    return isSuperAdmin || false;
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

  // Computed properties for easy access
  const isGIA = member?.unitType === 'gia' || false;
  const isPastor = hasSystemRole('pastor');
  const isAdmin = hasSystemRole('admin') || hasSystemRole('super_admin');
  const isLeader = member?.leadershipRoles?.isDistrictPastor ||
                   member?.leadershipRoles?.isUnitHead ||
                   member?.leadershipRoles?.isChamp ||
                   (member as any)?.role === 'super_admin' ||
                   false;

  // More comprehensive authentication check
  const hasToken = !!localStorage.getItem('auth_token');
  const isAuthenticated = !!member || (hasToken && !!cachedPermissions);

  // Module-specific access checks
  const canManageMembers = canAccessModule('members');
  const canAccessFirstTimers = canAccessModule('first_timers');
  const canManageGroups = canAccessModule('units');

  // Debug logging for computed properties
  console.log('AuthContext computed properties:', {
    member: !!member,
    cachedPermissions: !!cachedPermissions,
    hasToken,
    isAuthenticated,
    isLoading,
    canManageMembers,
    canAccessFirstTimers,
    canManageGroups,
    isAdmin
  });

  const value: AuthContextType = {
    member,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth,
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