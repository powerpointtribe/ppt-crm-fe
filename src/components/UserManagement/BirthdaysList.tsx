import { Cake, ChevronLeft, ChevronRight, Gift, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';
import type { Member } from '../../types';

interface BirthdaysListProps {
  members: Member[];
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

    let age: number | null = null;
    const birthYear = dob.getFullYear();
    if (birthYear > 1900 && birthYear < now.getFullYear()) {
      age = now.getFullYear() - birthYear;
      if (month > currentMonth || (month === currentMonth && day > currentDay)) {
        age--;
      }
      if (isToday || (!isPast && month === currentMonth)) {
        age++;
      }
    }

    return { day, monthName, isToday, isPast, daysUntil, age };
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

  // Sort: today first, then upcoming, then past
  const sorted = [...members].sort((a, b) => {
    const aInfo = getBirthdayInfo(a.dateOfBirth);
    const bInfo = getBirthdayInfo(b.dateOfBirth);
    if (aInfo.isToday && !bInfo.isToday) return -1;
    if (!aInfo.isToday && bInfo.isToday) return 1;
    return aInfo.day - bInfo.day;
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sorted.map((member) => {
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
                    {info.age && (
                      <span className={`text-[10px] font-medium ${info.isToday ? 'text-purple-600' : 'text-gray-400'}`}>
                        {info.isToday ? `Turns ${info.age}` : `${info.age} yrs`}
                      </span>
                    )}
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
        })}
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
