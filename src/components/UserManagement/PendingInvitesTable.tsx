import { Send, X, ChevronLeft, ChevronRight, Mail, Clock, User } from 'lucide-react';
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
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invitations && invitations.map((invitation) => {
          const timeRemaining = getTimeRemaining(invitation.expiresAt);

          return (
            <div
              key={invitation._id}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
            >
              {/* Header: Name and Role */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">
                    {invitation.member.firstName} {invitation.member.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{invitation.member.email}</p>
                </div>
                <Badge variant="info" className="text-xs ml-2 flex-shrink-0">
                  {invitation.role.displayName || invitation.role.name}
                </Badge>
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase">Invited By</span>
                  <p className="text-gray-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase">Status</span>
                  <div className="flex items-center gap-1.5">
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
                </div>
              </div>

              {/* Email Status & Resend Count */}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {invitation.emailSent ? (
                    <>
                      <Mail className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 text-xs">
                        Sent {formatDate(invitation.emailSentAt || invitation.createdAt)}
                      </span>
                    </>
                  ) : (
                    <Badge variant="warning" className="text-xs">Not Sent</Badge>
                  )}
                </div>
                {invitation.resendCount > 0 && (
                  <Badge className="text-xs">Resent {invitation.resendCount}x</Badge>
                )}
              </div>

              {/* Actions */}
              {canInviteUsers && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onResend(invitation._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Resend
                  </button>
                  <button
                    onClick={() => onRevoke(invitation._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Revoke
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Member
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden xl:table-cell">
                Invited By
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                Sent
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Expires
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden xl:table-cell">
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
                      <p className="text-sm text-gray-500 lg:hidden">{invitation.member.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 hidden lg:table-cell">
                    <p className="text-sm text-gray-600">{invitation.member.email}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="info">
                      {invitation.role.displayName || invitation.role.name}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 hidden xl:table-cell">
                    <p className="text-sm text-gray-600">
                      {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </p>
                  </td>
                  <td className="py-4 px-4 hidden lg:table-cell">
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
                  <td className="py-4 px-4 hidden xl:table-cell">
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
