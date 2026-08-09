import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, CheckCircle2, FileX } from 'lucide-react';
import type { MentorSummary } from '../types';
import { searchMentors } from '../services/mentorApi';
import { PaginatedDirectory } from './PaginatedDirectory';
import type { ColumnDef } from './PaginatedDirectory';

interface MentorSearchProps {
  onSelectMentor: (mentorId: string) => void;
}

const StudentTooltipCell: React.FC<{ mentor: MentorSummary }> = ({ mentor }) => {
  const [popDirection, setPopDirection] = useState<'up' | 'down'>('up');

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < window.innerHeight / 2) {
      setPopDirection('down');
    } else {
      setPopDirection('up');
    }
  };

  return (
    <div className="relative inline-block group" onMouseEnter={handleMouseEnter}>
      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer hover:bg-sky-100 transition">
        <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        {mentor.studentCount} {mentor.studentCount === 1 ? 'תלמיד' : 'תלמידים'}
      </span>

      {mentor.students && mentor.students.length > 0 && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl z-30 min-w-[150px] max-w-[220px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-150 ${
            popDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <ul className="text-right space-y-1 max-h-36 overflow-y-auto">
            {mentor.students.map((st) => (
              <li key={st.id} className="text-[11px] text-slate-200 truncate font-medium">
                • {st.firstName} {st.lastName}
              </li>
            ))}
          </ul>
          <div
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
              popDirection === 'down'
                ? 'bottom-full border-b-slate-900'
                : 'top-full border-t-slate-900'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export const MentorSearch: React.FC<MentorSearchProps> = ({ onSelectMentor }) => {
  const [query, setQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);

  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [totalMentors, setTotalMentors] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    searchMentors({
      query,
      sortBy,
      sortDirection,
      page,
      limit: 50,
    })
      .then((res) => {
        setMentors(res.mentors);
        setTotalMentors(res.total);
        setTotalPages(res.totalPages);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'שגיאה בחיפוש מדריכים');
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [query, sortBy, sortDirection, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setQuery('');
    setSortBy('name');
    setSortDirection('asc');
    setPage(1);
  };

  const columns: ColumnDef<MentorSummary>[] = [
    {
      key: 'name',
      header: 'שם המדריך/ה',
      sortable: true,
      render: (m) => (
        <div>
          <span className="block text-xs font-bold text-slate-900">
            {m.firstName} {m.lastName}
          </span>
          <span className="text-[10px] text-slate-500 font-normal sm:hidden">{m.email}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'דוא"ל',
      sortable: true,
      render: (m) => <span className="font-mono text-xs text-slate-600">{m.email}</span>,
    },
    {
      key: 'studentCount',
      header: 'מספר תלמידים',
      sortable: true,
      align: 'center',
      render: (m) => <StudentTooltipCell mentor={m} />,
    },
    {
      key: 'mentorApprovedHours',
      header: 'שעות הדרכה מאושרות',
      sortable: true,
      render: (m) => (
        <div className="font-bold text-slate-900 text-xs">
          {m.submittedHours.mentorApproved} <span className="text-[10px] font-normal text-slate-500">שעות</span>
        </div>
      ),
    },
    {
      key: 'mentorPendingHours',
      header: 'שעות ממתינות לאישור',
      sortable: true,
      render: (m) =>
        m.submittedHours.mentorPending > 0 ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {m.submittedHours.mentorPending} שעות ממתינות
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] font-medium">אין שעות ממתינות</span>
        ),
    },
    {
      key: 'signatureSubmitted',
      header: 'הצהרה חתומה',
      sortable: true,
      align: 'center',
      render: (m) =>
        m.signatureSubmitted ? (
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            הוגשה
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
            <FileX className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            טרם הוגשה
          </span>
        ),
    },
  ];

  return (
    <PaginatedDirectory<MentorSummary>
      title="מדריכים"
      subtitle="מעקב וסריקה מרוכזת של מדריכי הפרקטיקום, שעות ההדרכה המאושרות והתלמידים תחת הדרכתם"
      icon={<UserCheck className="w-5 h-5 text-teal-700" />}
      query={query}
      onQueryChange={(q) => {
        setQuery(q);
        setPage(1);
      }}
      searchPlaceholder="חפש מדריך לפי שם או כתובת דוא&quot;ל..."
      isFiltered={false}
      onClearFilters={handleClearFilters}
      items={mentors}
      total={totalMentors}
      page={page}
      totalPages={totalPages}
      onPageChange={(p) => setPage(p)}
      columns={columns}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={(m) => onSelectMentor(m.id)}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyText="לא נמצאו מדריכים מתאימים"
      itemKey={(m) => m.id}
    />
  );
};
