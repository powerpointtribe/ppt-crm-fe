import { Edit, UserX, Trash2, ChevronLeft, ChevronRight, Phone, Mail, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { ActiveUser } from '../../services/user-invitations';

interface ActiveUsersTableProps {
  users: ActiveUser[];
  onEditRole: (user: ActiveUser) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canManageUsers?: boolean;
  canDeleteUsers?: boolean;
}

export default function ActiveUsersTable({
  users,
  onEditRole,
  onDeactivate,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  canManageUsers = false,
  canDeleteUsers = false,
}: ActiveUsersTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (users?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <UserX className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Users</h3>
        <p className="text-gray-600">
          No users with platform access found. Start by inviting members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users && users.map((user) => (
          <div
            key={user._id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            {/* Header: Name and Status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {user.role ? (
                    <Badge variant="info" className="text-xs">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge className="text-xs">No Role</Badge>
                  )}
                  {user.isActive ? (
                    <Badge variant="success" className="text-xs">Active</Badge>
                  ) : (
                    <Badge variant="error" className="text-xs">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs">Last login: {formatDate(user.lastLogin)}</span>
              </div>
            </div>

            {/* Actions */}
            {(canManageUsers || canDeleteUsers) && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                {canManageUsers && (
                  <>
                    <button
                      onClick={() => onEditRole(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Role
                    </button>
                    <button
                      onClick={() => onDeactivate(user._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate
                    </button>
                  </>
                )}
                {canDeleteUsers && (
                  <button
                    onClick={() => onDelete(user._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                User
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                Phone
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden xl:table-cell">
                Last Login
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users && users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-600">{user.email}</p>
                </td>
                <td className="py-4 px-4 hidden lg:table-cell">
                  <p className="text-sm text-gray-600">{user.phone || '-'}</p>
                </td>
                <td className="py-4 px-4">
                  {user.role ? (
                    <Badge variant="info">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge>No Role</Badge>
                  )}
                </td>
                <td className="py-4 px-4">
                  {user.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="error">Inactive</Badge>
                  )}
                </td>
                <td className="py-4 px-4 hidden xl:table-cell">
                  <p className="text-sm text-gray-600">
                    {formatDate(user.lastLogin)}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end gap-2">
                    {canManageUsers && (
                      <>
                        <button
                          onClick={() => onEditRole(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeactivate(user._id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Deactivate User"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {canDeleteUsers && (
                      <button
                        onClick={() => onDelete(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!canManageUsers && !canDeleteUsers && (
                      <span className="text-sm text-gray-400">No actions</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
