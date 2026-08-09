import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Clock, CheckCircle2, FileX, Users } from 'lucide-react';
import type { StudentSummary } from '../types';
import { searchStudents, getStudentClasses } from '../services/studentApi';
import { PaginatedDirectory } from './PaginatedDirectory';
import type { ColumnDef } from './PaginatedDirectory';

interface StudentSearchProps {
  onSelectStudent: (studentId: string) => void;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({ onSelectStudent }) => {
  const [query, setQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [classList, setClassList] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [signatureOnlyFilter, setSignatureOnlyFilter] = useState<boolean>(false);

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch classes from backend endpoint GET /api/v1/reports/classes
  useEffect(() => {
    let isMounted = true;
    getStudentClasses()
      .then((classes) => {
        if (isMounted && Array.isArray(classes)) {
          setClassList(classes);
        }
      })
      .catch((err) => {
        console.warn('Failed to load classes list:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableClasses = useMemo(() => {
    const fetchedStudentClasses = students.map((s) => s.className).filter(Boolean);
    const set = new Set([...classList, ...fetchedStudentClasses]);
    return Array.from(set).filter((c) => Boolean(c && c.trim())).sort();
  }, [classList, students]);

  const loadData = () => {
    setIsSearching(true);
    setSearchError(null);

    searchStudents({
      query,
      className: classFilter,
      sortBy,
      sortDirection,
      page,
      limit: 50,
    })
      .then((res) => {
        setStudents(res.students);
        setTotalStudents(res.total);
        setTotalPages(res.totalPages);
        setIsSearching(false);
      })
      .catch((err: any) => {
        setSearchError(err.message || 'שגיאה בחיפוש תלמידים');
        setIsSearching(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [query, classFilter, sortBy, sortDirection, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (signatureOnlyFilter && st.signatureSubmitted === true) {
        return false;
      }
      return true;
    });
  }, [students, signatureOnlyFilter]);

  const handleToggleSignatureFilter = () => {
    setSignatureOnlyFilter((prev) => !prev);
    setPage(1);
  };

  const handleClearFilters = () => {
    setQuery('');
    setClassFilter('all');
    setSignatureOnlyFilter(false);
    setSortBy('name');
    setSortDirection('asc');
    setPage(1);
  };

  const columns: ColumnDef<StudentSummary>[] = [
    {
      key: 'name',
      header: 'שם מלא',
      sortable: true,
      render: (s) => (
        <div>
          <span className="block text-xs font-bold text-slate-900">
            {s.firstName} {s.lastName}
          </span>
          <span className="text-[10px] text-slate-500 font-normal sm:hidden">{s.email}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'מחזור',
      sortable: true,
      render: (s) => (
        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold inline-block">
          {s.className || 'לא צוין'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'דוא"ל',
      sortable: true,
      render: (s) => <span className="font-mono text-xs text-slate-600">{s.email}</span>,
    },
    {
      key: 'clientHours',
      header: 'מטופלים פרטיים',
      sortable: true,
      render: (s) => (
        <div className="inline-block" title="סכום שעות טיפול שהוגשו ושעות מנהלתיות ידניות">
          <div className="font-bold text-slate-900 text-xs">
            {s.clientHours} <span className="text-[10px] font-normal text-slate-500">/ 300 ש'</span>
          </div>
          <div className="w-14 bg-slate-200 h-1 rounded-full mt-0.5 overflow-hidden">
            <div
              className="bg-teal-700 h-full"
              style={{ width: `${Math.min(100, (s.clientHours / 300) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'mentorApprovedHours',
      header: 'הדרכה מאושרת',
      sortable: true,
      render: (s) => (
        <div className="inline-block" title="סכום שעות הדרכה מאושרות ושעות מנהלתיות ידניות">
          <div className="font-bold text-slate-900 text-xs">
            {s.mentorApprovedHours} <span className="text-[10px] font-normal text-slate-500">/ 100 ש'</span>
          </div>
          <div className="w-14 bg-slate-200 h-1 rounded-full mt-0.5 overflow-hidden">
            <div
              className="bg-sky-600 h-full"
              style={{ width: `${Math.min(100, (s.mentorApprovedHours / 100) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'therapistHours',
      header: 'טיפול אישי',
      sortable: true,
      render: (s) => (
        <div className="inline-block" title="סכום שעות טיפול אישי שהוגשו ושעות מנהלתיות ידניות">
          <div className="font-bold text-slate-900 text-xs">
            {s.therapistHours} <span className="text-[10px] font-normal text-slate-500">/ 150 ש'</span>
          </div>
          <div className="w-14 bg-slate-200 h-1 rounded-full mt-0.5 overflow-hidden">
            <div
              className="bg-amber-600 h-full"
              style={{ width: `${Math.min(100, (s.therapistHours / 150) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'mentorPendingHours',
      header: 'ממתין לאישור',
      sortable: true,
      render: (s) =>
        s.mentorPendingHours > 0 ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {s.mentorPendingHours} שעות
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] font-medium">אין ממתינים</span>
        ),
    },
    {
      key: 'signatureSubmitted',
      header: 'הצהרה חתומה',
      sortable: true,
      align: 'center',
      render: (s) =>
        s.signatureSubmitted === true ? (
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

  const extraFilters = (
    <div className="flex flex-wrap items-center space-x-1.5 space-x-reverse gap-y-1 text-xs">
      <span className="text-slate-500 font-medium flex items-center gap-1 ml-1">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        מחזור:
      </span>

      <button
        onClick={() => {
          setClassFilter('all');
          setPage(1);
        }}
        className={`px-2.5 py-1 rounded transition border font-medium ${
          classFilter === 'all'
            ? 'bg-teal-800 text-white border-teal-800'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        כל המחזורים
      </button>

      {availableClasses.map((cls) => (
        <button
          key={cls}
          onClick={() => {
            setClassFilter(cls);
            setPage(1);
          }}
          className={`px-2.5 py-1 rounded transition border font-medium ${
            classFilter === cls
              ? 'bg-teal-800 text-white border-teal-800'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {cls}
        </button>
      ))}

      <button
        onClick={handleToggleSignatureFilter}
        className={`px-2.5 py-1 rounded transition border font-medium flex items-center gap-1.5 ${
          signatureOnlyFilter
            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        <FileX className={`w-3.5 h-3.5 ${signatureOnlyFilter ? 'text-amber-700' : 'text-slate-400'}`} />
        <span>חסרה הצהרה חתומה</span>
      </button>
    </div>
  );

  const displayTotal = signatureOnlyFilter ? filteredStudents.length : totalStudents;
  const displayTotalPages = signatureOnlyFilter
    ? Math.max(1, Math.ceil(filteredStudents.length / 50))
    : totalPages;

  return (
    <PaginatedDirectory<StudentSummary>
      title="תלמידים"
      subtitle="איתור, סינון וסריקה של שעות הדיווחי קליניים עבור תלמידי הפרקטיקום"
      icon={<Users className="w-5 h-5 text-teal-700" />}
      query={query}
      onQueryChange={(q) => {
        setQuery(q);
        setPage(1);
      }}
      searchPlaceholder="חפש תלמיד לפי שם, דוא&quot;ל, מס' ת&quot;ז או מחזור לימודים..."
      extraFilters={extraFilters}
      isFiltered={classFilter !== 'all' || signatureOnlyFilter}
      onClearFilters={handleClearFilters}
      items={filteredStudents}
      total={displayTotal}
      page={page}
      totalPages={displayTotalPages}
      onPageChange={(p) => setPage(p)}
      columns={columns}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRowClick={(st) => onSelectStudent(st.id)}
      loading={isSearching}
      error={searchError}
      onRetry={loadData}
      emptyText="לא נמצאו תלמידים מתאימים"
      itemKey={(st) => st.id}
    />
  );
};
