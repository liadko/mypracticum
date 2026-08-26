import React, { useState, useEffect } from 'react';
import { ArrowRight, UserCheck, Users, Clock, CheckCircle2, FileX, AlertTriangle, Mail, RefreshCw, Calendar, ChevronLeft } from 'lucide-react';
import type { MentorDetailReport, ReportEvent, MentorStudentConnected } from '../types';
import { getMentorReport } from '../services/mentorApi';
import { ActivityCalendar } from './ActivityCalendar';

interface MentorDetailsProps {
  mentorId: string;
  onBack: () => void;
  onSelectStudent?: (studentId: string) => void;
}

export const MentorDetails: React.FC<MentorDetailsProps> = ({
  mentorId,
  onBack,
  onSelectStudent,
}) => {
  const [report, setReport] = useState<MentorDetailReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'students'>(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subTab');
    return sub === 'students' ? 'students' : 'calendar';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subTab');
      setActiveTab(sub === 'students' ? 'students' : 'calendar');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabSwitch = (tab: 'calendar' | 'students') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'students') {
      url.searchParams.set('subTab', 'students');
    } else {
      url.searchParams.delete('subTab');
    }
    window.history.pushState({}, '', url.toString());
  };

  const fetchMentorData = () => {
    setLoading(true);
    setError(null);

    getMentorReport(mentorId)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'שגיאה בטעינת נתוני המדריך');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMentorData();
  }, [mentorId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 dir-rtl">
        <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-3" />
        <span className="text-xs font-semibold text-slate-700">טוען דוח מדריך משרת ה-API...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center dir-rtl">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 max-w-lg mx-auto shadow-2xs">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 mb-1">שגיאה בטעינת נתוני מדריך</h3>
          <p className="text-xs text-rose-800 mb-4">{error || 'הנתונים אינם זמינים כעת'}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={fetchMentorData}
              className="text-xs bg-slate-900 text-white px-3.5 py-1.5 rounded font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>נסה שוב</span>
            </button>
            <button
              onClick={onBack}
              className="text-xs bg-white text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded font-semibold hover:bg-slate-100 transition"
            >
              חזרה לרשימה
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { mentor, students, events } = report;

  // Convert MentorEvent DTOs to standard ReportEvent for ActivityCalendar reuse
  const calendarReportEvents: ReportEvent[] = events.map((ev) => ({
    id: ev.id,
    date: ev.date,
    category: 'mentor',
    contactId: ev.studentId,
    contactName: `${ev.studentName}${ev.studentClass ? ` (${ev.studentClass})` : ''}`,
    hours: ev.hours,
    approved: ev.approved,
    source: ev.source,
    notes: ev.notes,
  }));

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 overflow-y-auto dir-rtl">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 space-x-reverse text-xs font-semibold text-slate-700 hover:text-teal-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded shadow-2xs transition self-start"
        >
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span>חזרה לרשימת מדריכים</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded font-bold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-700" />
            <span>מדריך</span>
          </span>
          {mentor.signatureSubmitted ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>הצהרה חתומה הוגשה</span>
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded font-bold flex items-center gap-1">
              <FileX className="w-3.5 h-3.5 text-amber-600" />
              <span>טרם הוגשה הצהרה</span>
            </span>
          )}
        </div>
      </div>

      {/* Mentor Identity Banner Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs mb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-sky-700 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
              {mentor.firstName?.[0] || 'מ'}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {mentor.firstName} {mentor.lastName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{mentor.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary Badges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">תלמידים שקשורים</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">{mentor.studentCount}</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded p-2.5">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">שעות מאושרות</span>
              <span className="text-base font-bold text-emerald-900 mt-0.5 block">
                {mentor.submittedHours.mentorApproved} ש'
              </span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded p-2.5">
              <span className="text-[10px] text-amber-900 font-bold block uppercase tracking-wider">ממתין לאישור</span>
              <span className="text-base font-bold text-amber-900 mt-0.5 block">
                {mentor.submittedHours.mentorPending} ש'
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 mb-3 bg-white rounded-t-lg px-2 pt-1.5 border border-slate-200 shadow-2xs">
        <button
          onClick={() => handleTabSwitch('calendar')}
          className={`px-3.5 py-1.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>יומן מפגשים</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('students')}
          className={`px-3.5 py-1.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>תלמידים שלנו</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
            {students.length}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'calendar' && (
        <ActivityCalendar
          events={calendarReportEvents}
          title="יומן מפגשי הדרכה שנרשמו עם מדריך זה"
          hideCategoryFilter={true}
        />
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs mb-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>תלמידים תחת הדרכתו של המדריך ({students.length})</span>
            </h3>
            <span className="text-xs text-slate-500">לחץ על כפתור צפייה בדוח לעיון בפרקטיקום מלא של תלמיד</span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded border border-dashed border-slate-200">
              לא נרשמו תלמידים משוייכים למדריך זה
            </div>
          ) : (
            <div className="reports-mentor-student-list overflow-x-auto">
              <table className="w-full text-xs text-slate-800 text-right">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">שם התלמיד</th>
                    <th className="px-3 py-2">מחזור</th>
                    <th className="px-3 py-2">ת"ז</th>
                    <th className="px-3 py-2">דוא"ל</th>
                    <th className="px-3 py-2">שעות הדרכה מאושרות</th>
                    <th className="px-3 py-2">שעות ממתינות</th>
                    <th className="px-3 py-2 text-left">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st: MentorStudentConnected) => (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-3 py-2 font-bold text-slate-900">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="px-3 py-2">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold inline-block">
                          {st.class || 'לא צוין'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{st.taz || '-'}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{st.email}</td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {st.submittedHours.mentorApproved} שעות
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {st.submittedHours.mentorPending > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            {st.submittedHours.mentorPending} שעות
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-left">
                        {onSelectStudent && (
                          <button
                            onClick={() => onSelectStudent(st.id)}
                            className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition inline-flex items-center gap-1 shadow-2xs"
                            title="צפה בדוח הפרקטיקום המלא של התלמיד"
                          >
                            <span>צפה בדוח</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-teal-700" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
