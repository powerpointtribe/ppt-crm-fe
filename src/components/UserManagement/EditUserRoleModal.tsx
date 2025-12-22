import { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import userInvitationsService from '../../services/user-invitations';
import type { ActiveUser } from '../../services/user-invitations';
import { rolesService } from '../../services/roles';

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

interface EditUserRoleModalProps {
  user: ActiveUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserRoleModal({ user, onClose, onSuccess }: EditUserRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(user.role?._id || '');
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useToast();

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await rolesService.getRoles({ isActive: true });
        setRoles(response.data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        showToast('Failed to load roles', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoleId) {
      showToast('Please select a role', 'error');
      return;
    }

    if (selectedRoleId === user.role?._id) {
      showToast('No changes made', 'info');
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await userInvitationsService.updateUserRole(user._id, {
        roleId: selectedRoleId,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      const message = error?.response?.data?.message || 'Failed to update user role';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-3">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit User Role</h2>
              <p className="text-sm text-gray-600 mt-1">
                Update the role for {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Name</p>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Current Role</p>
                  {user.role ? (
                    <Badge variant="info">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge>No Role</Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  {user.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="error">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* New Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Role <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName || role.name}
                    {role.description && ` - ${role.description}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The new role will determine what permissions the user has
              </p>
            </div>

            {/* Warning */}
            {selectedRoleId && selectedRoleId !== user.role?._id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Important Notice</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• The user's permissions will change immediately</li>
                  <li>• They may need to log out and log back in to see changes</li>
                  <li>• Make sure the new role has appropriate permissions</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedRoleId}>
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Updating...</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Role
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
