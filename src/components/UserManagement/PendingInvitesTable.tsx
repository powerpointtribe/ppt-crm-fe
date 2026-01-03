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
      return { text: `${diffDays}d left`, isExpired: false };
    } else if (diffHours > 0) {
      return { text: `${diffHours}h left`, isExpired: false };
    } else {
      return { text: '<1h', isExpired: false };
    }
  };

  if (invitations?.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <Mail className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Pending Invitations</h3>
        <p className="text-xs text-gray-500">
          All invitations have been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invitations && invitations.map((invitation) => {
          const timeRemaining = getTimeRemaining(invitation.expiresAt);

          return (
            <div
              key={invitation._id}
              className="bg-white border border-gray-100 rounded-xl p-3 space-y-2 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">
                    {invitation.member.firstName} {invitation.member.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{invitation.member.email}</p>
                </div>
                <Badge variant="info" className="text-[10px] ml-2 flex-shrink-0">
                  {invitation.role.displayName || invitation.role.name}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={timeRemaining.isExpired ? 'text-red-600' : 'text-gray-500'}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {timeRemaining.text}
                </span>
                {invitation.resendCount > 0 && (
                  <Badge className="text-[10px]">Resent {invitation.resendCount}x</Badge>
                )}
              </div>

              {canInviteUsers && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onResend(invitation._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Resend
                  </button>
                  <button
                    onClick={() => onRevoke(invitation._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
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
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Member</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 hidden lg:table-cell">Email</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Role</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 hidden xl:table-cell">Invited By</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Expires</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 hidden lg:table-cell">Resent</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invitations && invitations.map((invitation) => {
              const timeRemaining = getTimeRemaining(invitation.expiresAt);

              return (
                <tr key={invitation._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3">
                    <p className="text-sm font-medium text-gray-900">
                      {invitation.member.firstName} {invitation.member.lastName}
                    </p>
                    <p className="text-xs text-gray-500 lg:hidden">{invitation.member.email}</p>
                  </td>
                  <td className="py-2 px-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-600">{invitation.member.email}</p>
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant="info" className="text-[10px]">
                      {invitation.role.displayName || invitation.role.name}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 hidden xl:table-cell">
                    <p className="text-xs text-gray-600">
                      {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </p>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs flex items-center gap-1 ${timeRemaining.isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      <Clock className={`w-3 h-3 ${timeRemaining.isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
                      {timeRemaining.text}
                    </span>
                  </td>
                  <td className="py-2 px-3 hidden lg:table-cell">
                    {invitation.resendCount > 0 ? (
                      <Badge className="text-[10px]">{invitation.resendCount}x</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-end gap-1">
                      {canInviteUsers ? (
                        <>
                          <button
                            onClick={() => onResend(invitation._id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Resend"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRevoke(invitation._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Revoke"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
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
