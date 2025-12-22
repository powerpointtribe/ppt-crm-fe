import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserPlus, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext-unified';
import userInvitationsService from '../services/user-invitations';
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
  const [activeTab, setActiveTab] = useState<TabType>('active-users');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { showToast } = useToast();
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
      const response = await userInvitationsService.getActiveUsers({
        page,
        limit: 10,
        search,
      });
      setActiveUsers(response.data);
      setActiveUsersPage(response?.pagination?.page || 1);
      setActiveUsersTotal(response?.pagination?.total || 0);
      setActiveUsersTotalPages(response?.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      showToast('Failed to load active users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending invites
  const fetchPendingInvites = async (page = 1) => {
    setLoading(true);
    try {
      const response = await userInvitationsService.getInvitations({
        page,
        limit: 10,
        status: 'pending',
      });
      setPendingInvites(response.data);
      setInvitesPage(response.pagination.page);
      setInvitesTotal(response.pagination.total);
      setInvitesTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
      showToast('Failed to load pending invites', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatistics();
    if (activeTab === 'active-users') {
      fetchActiveUsers(1, searchQuery);
    } else {
      fetchPendingInvites(1);
    }
  }, [activeTab]);

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
    showToast('Invitation sent successfully!', 'success');
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
    showToast('User role updated successfully!', 'success');
  };

  // Handle deactivate user
  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await userInvitationsService.deactivateUser(userId);
      showToast('User deactivated successfully', 'success');
      fetchActiveUsers(activeUsersPage, searchQuery);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      showToast('Failed to deactivate user', 'error');
    }
  };

  // Handle delete user access
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently remove this user\'s access? This action cannot be undone.')) return;

    try {
      await userInvitationsService.deleteUserAccess(userId);
      showToast('User access removed successfully', 'success');
      fetchActiveUsers(activeUsersPage, searchQuery);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete user access:', error);
      showToast('Failed to delete user access', 'error');
    }
  };

  // Handle resend invitation
  const handleResendInvite = async (invitationId: string) => {
    try {
      await userInvitationsService.resendInvitation(invitationId);
      showToast('Invitation resent successfully', 'success');
      fetchPendingInvites(invitesPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      showToast('Failed to resend invitation', 'error');
    }
  };

  // Handle revoke invitation
  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      await userInvitationsService.revokeInvitation(invitationId);
      showToast('Invitation revoked successfully', 'success');
      fetchPendingInvites(invitesPage);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      showToast('Failed to revoke invitation', 'error');
    }
  };

  // Check if user has permission to view users
  if (!canViewUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view user management. Please contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user invitations and platform access
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canInviteUsers && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{statistics.accepted}</p>
              </div>
              <Badge variant="success">Accepted</Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revoked</p>
                <p className="text-2xl font-bold text-red-600">{statistics.revoked}</p>
              </div>
              <Badge variant="error">Revoked</Badge>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.expired}</p>
              </div>
              <Badge>Expired</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs and Search */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('active-users')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'active-users'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Active Users ({activeUsersTotal})
              </button>
              <button
                onClick={() => setActiveTab('pending-invites')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'pending-invites'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Pending Invites ({invitesTotal})
              </button>
            </div>

            {activeTab === 'active-users' && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

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
  );
}
