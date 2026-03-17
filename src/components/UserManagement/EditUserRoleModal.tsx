import { useState, useEffect } from 'react';
import { X, Edit, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import userInvitationsService from '../../services/user-invitations';
import type { ActiveUser } from '../../services/user-invitations';
import { rolesService } from '../../services/roles';
import { membersService } from '../../services/members-unified';

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
  const [additionalRoles, setAdditionalRoles] = useState<{ _id: string; name: string; displayName: string }[]>(
    user.additionalRoles || [],
  );
  const [addRoleId, setAddRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);

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

  // Available roles for additional selection (exclude primary and already-added roles)
  const availableForAdditional = roles.filter(
    (r) =>
      r._id !== selectedRoleId &&
      !additionalRoles.some((ar) => ar._id === r._id),
  );

  // Handle primary role submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoleId) {
      toast.error('Please select a primary role');
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

  // Handle adding an additional role
  const handleAddRole = async () => {
    if (!addRoleId) return;

    setSubmitting(true);
    try {
      await membersService.addRole(user._id, addRoleId);
      const addedRole = roles.find((r) => r._id === addRoleId);
      if (addedRole) {
        setAdditionalRoles((prev) => [
          ...prev,
          { _id: addedRole._id, name: addedRole.name, displayName: addedRole.displayName },
        ]);
      }
      setAddRoleId('');
      toast.success('Additional role added');
    } catch (error: any) {
      console.error('Failed to add role:', error);
      const message = error?.response?.data?.message || 'Failed to add role';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle removing an additional role
  const handleRemoveRole = async (roleId: string) => {
    setRemovingRoleId(roleId);
    try {
      await membersService.removeRole(user._id, roleId);
      setAdditionalRoles((prev) => prev.filter((r) => r._id !== roleId));
      toast.success('Role removed');
    } catch (error: any) {
      console.error('Failed to remove role:', error);
      const message = error?.response?.data?.message || 'Failed to remove role';
      toast.error(message);
    } finally {
      setRemovingRoleId(null);
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
              <h2 className="text-base font-bold text-gray-900">Edit User Roles</h2>
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
          <div className="space-y-3">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Primary Role</p>
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

            {/* Primary Role Selection */}
            <form onSubmit={handleSubmit}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Primary Role <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.displayName || role.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={submitting || !selectedRoleId || selectedRoleId === user.role?._id}>
                  {submitting ? <LoadingSpinner /> : 'Save'}
                </Button>
              </div>
            </form>

            {/* Additional Roles */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Roles
              </label>

              {/* Current additional roles */}
              {additionalRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {additionalRoles.map((role) => (
                    <span
                      key={role._id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs"
                    >
                      {role.displayName || role.name}
                      <button
                        onClick={() => handleRemoveRole(role._id)}
                        disabled={removingRoleId === role._id}
                        className="text-purple-400 hover:text-red-500 transition-colors"
                      >
                        {removingRoleId === role._id ? (
                          <LoadingSpinner />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 mb-2">No additional roles assigned</p>
              )}

              {/* Add additional role */}
              {availableForAdditional.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={addRoleId}
                    onChange={(e) => setAddRoleId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Add a role...</option>
                    {availableForAdditional.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName || role.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRole}
                    disabled={!addRoleId || submitting}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Warning */}
            {(selectedRoleId !== user.role?._id || additionalRoles.length !== (user.additionalRoles?.length || 0)) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-[10px] text-yellow-800">
                  Permission changes take effect immediately. User may need to re-login.
                </p>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
