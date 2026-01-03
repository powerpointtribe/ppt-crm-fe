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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (users?.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <UserX className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Active Users</h3>
        <p className="text-xs text-gray-500">
          No users with platform access found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {users && users.map((user) => (
          <div
            key={user._id}
            className="bg-white border border-gray-100 rounded-xl p-3 space-y-2 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="flex gap-1">
                {user.role ? (
                  <Badge variant="info" className="text-[10px]">
                    {user.role.displayName || user.role.name}
                  </Badge>
                ) : (
                  <Badge className="text-[10px]">No Role</Badge>
                )}
              </div>
            </div>

            {(canManageUsers || canDeleteUsers) && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                {canManageUsers && (
                  <>
                    <button
                      onClick={() => onEditRole(user)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDeactivate(user._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded transition-colors"
                    >
                      <UserX className="w-3 h-3" />
                      Deactivate
                    </button>
                  </>
                )}
                {canDeleteUsers && (
                  <button
                    onClick={() => onDelete(user._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
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
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">User</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Email</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 hidden lg:table-cell">Phone</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Role</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Status</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 hidden xl:table-cell">Last Login</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users && users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </td>
                <td className="py-2 px-3">
                  <p className="text-xs text-gray-600">{user.email}</p>
                </td>
                <td className="py-2 px-3 hidden lg:table-cell">
                  <p className="text-xs text-gray-600">{user.phone || '-'}</p>
                </td>
                <td className="py-2 px-3">
                  {user.role ? (
                    <Badge variant="info" className="text-[10px]">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px]">No Role</Badge>
                  )}
                </td>
                <td className="py-2 px-3">
                  {user.isActive ? (
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  ) : (
                    <Badge variant="error" className="text-[10px]">Inactive</Badge>
                  )}
                </td>
                <td className="py-2 px-3 hidden xl:table-cell">
                  <p className="text-xs text-gray-500">{formatDate(user.lastLogin)}</p>
                </td>
                <td className="py-2 px-3">
                  <div className="flex justify-end gap-1">
                    {canManageUsers && (
                      <>
                        <button
                          onClick={() => onEditRole(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Role"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeactivate(user._id)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Deactivate"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {canDeleteUsers && (
                      <button
                        onClick={() => onDelete(user._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!canManageUsers && !canDeleteUsers && (
                      <span className="text-xs text-gray-400">-</span>
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
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
