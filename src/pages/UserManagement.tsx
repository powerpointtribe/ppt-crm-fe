import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, UserPlus, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import Layout from '@/components/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext-unified';
import userInvitationsService from '../services/user-invitations';
import { useAppStore } from '@/store';
import type {
  ActiveUser,
  UserInvitation,
  InvitationStatistics,
} from '../services/user-invitations';
import InviteUserModal from '../components/UserManagement/InviteUserModal';
import ActiveUsersTable from '../components/UserManagement/ActiveUsersTable';
import PendingInvitesTable from '../components/UserManagement/PendingInvitesTable';
import EditUserRoleModal from '../components/UserManagement/EditUserRoleModal';

type TabType = 'active-users' | 'pending-invites';

export default function UserManagement() {
  const { selectedBranch, branches } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('active-users');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0;

  // Active Users State
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeUsersPage, setActiveUsersPage] = useState(1);
  const [activeUsersTotal, setActiveUsersTotal] = useState(0);
  const [activeUsersTotalPages, setActiveUsersTotalPages] = useState(0);

  // Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<UserInvitation[]>([]);
  const [invitesPage, setInvitesPage] = useState(1);
  const [invitesTotal, setInvitesTotal] = useState(0);
  const [invitesTotalPages, setInvitesTotalPages] = useState(0);

  // Statistics
  const [statistics, setStatistics] = useState<InvitationStatistics | null>(null);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);

  const toast = useToast();
  const { hasPermission } = useAuth();

  // Permission checks
  const canViewUsers = hasPermission('users:view');
  const canInviteUsers = hasPermission('users:invite');
  const canManageUsers = hasPermission('users:manage');
  const canDeleteUsers = hasPermission('users:delete');

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const stats = await userInvitationsService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Fetch active users
  const fetchActiveUsers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined;
      const response = await userInvitationsService.getActiveUsers({
        page,
        limit: 10,
        search,
        branchId: effectiveBranchId,
      });
      setActiveUsers(response.data);
      setActiveUsersPage(response?.pagination?.page || 1);
      setActiveUsersTotal(response?.pagination?.total || 0);
      setActiveUsersTotalPages(response?.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      toast.error('Failed to load active users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending invites
  const fetchPendingInvites = async (page = 1) => {
    setLoading(true);
    try {
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined;
      const response = await userInvitationsService.getInvitations({
        page,
        limit: 10,
        status: 'pending',
        branchId: effectiveBranchId,
      });
      setPendingInvites(response.data);
      setInvitesPage(response.pagination.page);
      setInvitesTotal(response.pagination.total);
      setInvitesTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
      toast.error('Failed to load pending invites');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'active-users') {
      fetchActiveUsers(1, searchQuery);
    } else {
      fetchPendingInvites(1);
    }
  }, [activeTab]);

  // Reload when branch filter changes
  useEffect(() => {
    if (activeTab === 'active-users') {
      fetchActiveUsers(1, searchQuery);
    } else {
      fetchPendingInvites(1);
    }
  }, [branchFilter, selectedBranch]);

  // Track initial load completion
  useEffect(() => {
    if (!loading) {
      setInitialLoad(false);
    }
  }, [loading]);

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'active-users') {
      fetchActiveUsers(1, searchQuery);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchStatistics();
    if (activeTab === 'active-users') {
      fetchActiveUsers(activeUsersPage, searchQuery);
    } else {
      fetchPendingInvites(invitesPage);
    }
  };

  // Handle invite success
  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchStatistics();
    if (activeTab === 'pending-invites') {
      fetchPendingInvites(1);
    }
    toast.success('Invitation sent successfully!');
  };

  // Handle edit role
  const handleEditRole = (user: ActiveUser) => {
    setSelectedUser(user);
    setShowEditRoleModal(true);
  };

  // Handle edit role success
  const handleEditRoleSuccess = () => {
    setShowEditRoleModal(false);
    setSelectedUser(null);
    fetchActiveUsers(activeUsersPage, searchQuery);
    toast.success('User role updated successfully!');
  };

  // Handle deactivate user
  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await userInvitationsService.deactivateUser(userId);
      toast.success('User deactivated successfully');
      fetchActiveUsers(activeUsersPage, searchQuery);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  // Handle delete user access
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently remove this user\'s access? This action cannot be undone.')) return;

    try {
      await userInvitationsService.deleteUserAccess(userId);
      toast.success('User access removed successfully');
      fetchActiveUsers(activeUsersPage, searchQuery);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete user access:', error);
      toast.error('Failed to delete user access');
    }
  };

  // Handle resend invitation
  const handleResendInvite = async (invitationId: string) => {
    try {
      await userInvitationsService.resendInvitation(invitationId);
      toast.success('Invitation resent successfully');
      fetchPendingInvites(invitesPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  // Handle revoke invitation
  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      await userInvitationsService.revokeInvitation(invitationId);
      toast.success('Invitation revoked successfully');
      fetchPendingInvites(invitesPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      toast.error('Failed to revoke invitation');
    }
  };

  // Search Section for Layout header
  const searchSection = (
    <div className="flex gap-3 items-center flex-wrap">
      <div className="flex-1 min-w-[250px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>
      {showBranchFilter && (
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Campuses</option>
          {branches.map(branch => (
            <option key={branch._id} value={branch._id}>{branch.name}</option>
          ))}
        </select>
      )}
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCw className="w-4 h-4" />
      </Button>
      {canInviteUsers && (
        <Button size="sm" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      )}
    </div>
  );

  // Check if user has permission to view users
  if (!canViewUsers) {
    return (
      <Layout title="User Management" subtitle="Manage user invitations and platform access">
        <ErrorBoundary
          error={{
            status: 403,
            message: 'Access Denied',
            details: "You don't have permission to view user management. Please contact your administrator for access."
          }}
        />
      </Layout>
    );
  }

  // Initial loading state
  if (initialLoad && loading) {
    return (
      <Layout
        title="User Management"
        subtitle="Manage user invitations and platform access"
        searchSection={searchSection}
      >
        <SkeletonTable />
      </Layout>
    );
  }

  return (
    <Layout
      title="User Management"
      subtitle="Manage user invitations and platform access"
      searchSection={searchSection}
    >
      <div className="space-y-6">

      {/* Statistics Cards */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{statistics.accepted}</p>
              </div>
              <Badge variant="success">Accepted</Badge>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revoked</p>
                <p className="text-2xl font-bold text-red-600">{statistics.revoked}</p>
              </div>
              <Badge variant="error">Revoked</Badge>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.expired}</p>
              </div>
              <Badge>Expired</Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-gray-200"
      >
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('active-users')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === 'active-users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Users className="w-4 h-4" />
            Active Users
            <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
              {activeUsersTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pending-invites')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
              ${activeTab === 'pending-invites'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <UserPlus className="w-4 h-4" />
            Pending Invites
            <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
              {statistics?.pending ?? invitesTotal}
            </span>
          </button>
        </nav>
      </motion.div>

      {/* Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : activeTab === 'active-users' ? (
            <ActiveUsersTable
              users={activeUsers}
              onEditRole={handleEditRole}
              onDeactivate={handleDeactivateUser}
              onDelete={handleDeleteUser}
              currentPage={activeUsersPage}
              totalPages={activeUsersTotalPages}
              onPageChange={(page) => fetchActiveUsers(page, searchQuery)}
              canManageUsers={canManageUsers}
              canDeleteUsers={canDeleteUsers}
            />
          ) : (
            <PendingInvitesTable
              invitations={pendingInvites}
              onResend={handleResendInvite}
              onRevoke={handleRevokeInvite}
              currentPage={invitesPage}
              totalPages={invitesTotalPages}
              onPageChange={fetchPendingInvites}
              canInviteUsers={canInviteUsers}
            />
          )}
        </div>
        </Card>
      </motion.div>

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {showEditRoleModal && selectedUser && (
        <EditUserRoleModal
          user={selectedUser}
          onClose={() => {
            setShowEditRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditRoleSuccess}
        />
      )}
      </div>
    </Layout>
  );
}
