import { Send, X, ChevronLeft, ChevronRight, Mail, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { UserInvitation } from '../../services/user-invitations';

interface PendingInvitesTableProps {
  invitations: UserInvitation[];
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canInviteUsers?: boolean;
}

export default function PendingInvitesTable({
  invitations,
  onResend,
  onRevoke,
  currentPage,
  totalPages,
  onPageChange,
  canInviteUsers = false,
}: PendingInvitesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs < 0) {
      return { text: 'Expired', isExpired: true };
    } else if (diffDays > 0) {
      return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, isExpired: false };
    } else if (diffHours > 0) {
      return { text: `${diffHours} hour${diffHours > 1 ? 's' : ''} left`, isExpired: false };
    } else {
      return { text: 'Less than 1 hour', isExpired: false };
    }
  };

  if (invitations?.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Mail className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
        <p className="text-gray-600">
          All invitations have been accepted, revoked, or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Member
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Invited By
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Sent
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Expires
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Resent
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invitations && invitations.map((invitation) => {
              const timeRemaining = getTimeRemaining(invitation.expiresAt);

              return (
                <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {invitation.member.firstName} {invitation.member.lastName}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-600">{invitation.member.email}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="info">
                      {invitation.role.displayName || invitation.role.name}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-600">
                      {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {invitation.emailSent ? (
                        <>
                          <Mail className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {formatDate(invitation.emailSentAt || invitation.createdAt)}
                          </span>
                        </>
                      ) : (
                        <Badge variant="warning">Not Sent</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 ${
                          timeRemaining.isExpired ? 'text-red-500' : 'text-yellow-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          timeRemaining.isExpired ? 'text-red-600 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {timeRemaining.text}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {invitation.resendCount > 0 ? (
                      <Badge>{invitation.resendCount}x</Badge>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      {canInviteUsers ? (
                        <>
                          <button
                            onClick={() => onResend(invitation._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Resend Invitation"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRevoke(invitation._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke Invitation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
