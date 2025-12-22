import { useState, useEffect } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import userInvitationsService from '../../services/user-invitations';
import { membersService } from '../../services/members-unified';
import { rolesService } from '../../services/roles';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role?: any;
}

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const toast = useToast();

  // Fetch members without platform access
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        // Fetch all members and filter those without roles or inactive
        const response = await membersService.getMembers({
          page: 1,
          limit: 100,
        });

        // Filter members who don't have platform access yet
        const membersWithoutAccess = response.items.filter(
          (member: Member) => !member.role || !member.isActive
        );

        setMembers(membersWithoutAccess);
      } catch (error) {
        console.error('Failed to fetch members:', error);
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await rolesService.getRoles({ isActive: true });
        setRoles(roles);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        toast.error('Failed to load roles');
      }
    };

    fetchRoles();
  }, []);

  // Filter members based on search
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Handle member selection
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberDropdown(false);
    setSearchQuery('');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    if (!selectedRoleId) {
      toast.error('Please select a role');
      return;
    }

    setSubmitting(true);
    try {
      await userInvitationsService.createInvitation({
        memberId: selectedMember._id,
        roleId: selectedRoleId,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create invitation:', error);
      const message = error?.response?.data?.message || 'Failed to send invitation';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invite User</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Send an invitation to grant platform access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Member <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {selectedMember ? (
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedMember.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        placeholder="Search members by name or email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowMemberDropdown(true);
                        }}
                        onFocus={() => setShowMemberDropdown(true)}
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {showMemberDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                          <div className="p-4 text-center text-gray-600">
                            {searchQuery
                              ? 'No members found matching your search'
                              : 'No members available for invitation'}
                          </div>
                        ) : (
                          filteredMembers.map((member) => (
                            <button
                              key={member._id}
                              type="button"
                              onClick={() => handleSelectMember(member)}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <p className="font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              {member.phone && (
                                <p className="text-xs text-gray-500">{member.phone}</p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only members without platform access are shown
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Role <span className="text-red-500">*</span>
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
                The role determines what permissions the user will have
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any notes about this invitation..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1.5 text-sm">What happens next?</h4>
              <ul className="text-xs text-blue-800 space-y-0.5">
                <li>• An email will be sent with login credentials</li>
                <li>• The user will receive a temporary password</li>
                <li>• They must change their password on first login</li>
                <li>• The invitation expires in 7 days</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedMember || !selectedRoleId}>
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Sending Invitation...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Invitation
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
