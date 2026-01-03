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

  const toast = useToast();

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const roles = await rolesService.getRoles({ isActive: true });
        setRoles(roles);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error('Failed to load roles');
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
      toast.error('Please select a role');
      return;
    }

    if (selectedRoleId === user.role?._id) {
      toast.info('No changes made');
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
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="sm">
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="bg-blue-100 p-1.5 rounded-lg mr-2">
              <Edit className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Edit User Role</h2>
              <p className="text-[10px] text-gray-500">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Role</p>
                  {user.role ? (
                    <Badge variant="info" className="text-[10px]">
                      {user.role.displayName || user.role.name}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px]">No Role</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* New Role Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                New Role <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning */}
            {selectedRoleId && selectedRoleId !== user.role?._id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-[10px] text-yellow-800">
                  Permissions will change immediately. User may need to re-login.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting || !selectedRoleId}>
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-1">Updating...</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-3 h-3 mr-1" />
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
