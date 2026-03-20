import { Cake, ChevronLeft, ChevronRight, Gift, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';

interface BirthdayMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
}

interface BirthdaysListProps {
  members: BirthdayMember[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function BirthdaysList({
  members,
  currentPage,
  totalPages,
  onPageChange,
}: BirthdaysListProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const getBirthdayInfo = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const day = dob.getDate();
    const month = dob.getMonth();
    const monthName = dob.toLocaleDateString('en-US', { month: 'short' });

    const isToday = month === currentMonth && day === currentDay;
    const isPast = month === currentMonth && day < currentDay;
    const daysUntil = day - currentDay;

    return { day, monthName, isToday, isPast, daysUntil };
  };

  if (members?.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
          <Cake className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Birthdays This Month</h3>
        <p className="text-xs text-gray-500">
          No members have birthdays this month.
        </p>
      </div>
    );
  }

  // Split into today and others, both ascending by day
  const todayMembers = members
    .filter((m) => getBirthdayInfo(m.dateOfBirth).isToday)
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  const otherMembers = [...members]
    .filter((m) => !getBirthdayInfo(m.dateOfBirth).isToday)
    .sort((a, b) => getBirthdayInfo(a.dateOfBirth).day - getBirthdayInfo(b.dateOfBirth).day);

  const renderCard = (member: BirthdayMember) => {
    const info = getBirthdayInfo(member.dateOfBirth);

    return (
      <div
        key={member._id}
        className={`
          relative rounded-xl border p-3 transition-all
          ${info.isToday
            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-[0_2px_12px_-3px_rgba(147,51,234,0.2)]'
            : info.isPast
              ? 'bg-gray-50/50 border-gray-100'
              : 'bg-white border-gray-100 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]'
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Date Circle */}
          <div className={`
            flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center
            ${info.isToday
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : info.isPast
                ? 'bg-gray-200 text-gray-500'
                : 'bg-white border border-gray-200 text-gray-700'
            }
          `}>
            <span className="text-[9px] font-semibold uppercase leading-none tracking-wider">
              {info.monthName}
            </span>
            <span className="text-base font-bold leading-tight">{info.day}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`text-sm font-semibold truncate ${info.isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                {member.firstName} {member.lastName}
              </h4>
              {info.isToday && (
                <span className="flex-shrink-0 text-xs">🎂</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {info.isToday && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                  <Gift className="w-2.5 h-2.5" />
                  Today!
                </span>
              )}
              {!info.isToday && !info.isPast && (
                <span className="text-[10px] text-blue-500 font-medium">
                  in {info.daysUntil} day{info.daysUntil !== 1 ? 's' : ''}
                </span>
              )}
              {info.isPast && (
                <span className="text-[10px] text-gray-400 font-medium">
                  {Math.abs(info.daysUntil)} day{Math.abs(info.daysUntil) !== 1 ? 's' : ''} ago
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                  <Phone className="w-2.5 h-2.5" />
                  {member.phone}
                </a>
              )}
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors truncate">
                  <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Today's Birthdays */}
      {todayMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            Today's Birthdays ({todayMembers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {todayMembers.map(renderCard)}
          </div>
        </div>
      )}

      {/* Others */}
      {otherMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cake className="w-3.5 h-3.5" />
            Others ({otherMembers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {otherMembers.map(renderCard)}
          </div>
        </div>
      )}

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
