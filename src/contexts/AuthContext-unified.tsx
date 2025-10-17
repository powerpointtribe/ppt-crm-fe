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
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const memberProfile = await membersService.getProfile();
        setMember(memberProfile);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Only remove token if it's specifically an authentication error (401)
      // Don't remove token for network errors or other temporary issues
      if (error.code === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        localStorage.removeItem('auth_token');
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
    try {
      const response = await membersService.register(data);
      localStorage.setItem('auth_token', response.access_token);
      // Handle both 'member' and 'user' properties from API response
      const memberData = response.member || (response as any).user;
      setMember(memberData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setMember(null);
  };

  // Access control helper methods
  const canAccessModule = (module: string): boolean => {
    // Handle both array format and fallback for super_admin
    if (member?.accessibleModules?.includes) {
      return member.accessibleModules.includes(module);
    }
    // Allow super_admin access to all modules
    return (member as any)?.role === 'super_admin' || false;
  };

  const hasSystemRole = (role: string): boolean => {
    // Handle both array format and single role format
    if (member?.systemRoles?.includes) {
      return member.systemRoles.includes(role);
    }
    // Check single role field from API
    return (member as any)?.role === role || false;
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

  // Module-specific access checks
  const canManageMembers = canAccessModule('members');
  const canAccessFirstTimers = canAccessModule('first_timers');
  const canManageGroups = canAccessModule('units');

  const value: AuthContextType = {
    member,
    isLoading,
    isAuthenticated: !!member,
    login,
    register,
    logout,
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