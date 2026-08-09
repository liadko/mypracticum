import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Mail, Hash, BookOpen, AlertTriangle, CheckCircle2, Calendar, Wrench, Users } from 'lucide-react';
import type { StudentReport } from '../types';
import { getStudentReport } from '../services/studentApi';
import { SummaryMetrics } from './SummaryMetrics';
import { ActivityCalendar } from './ActivityCalendar';
import { ManualHoursTable } from './ManualHoursTable';
import { ContactsSection } from './ContactsSection';

interface StudentDetailsProps {
  studentId: string;
  onBack: () => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ studentId, onBack }) => {
  const [report, setReport] = useState<StudentReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'markings' | 'manual' | 'contacts'>('markings');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getStudentReport(studentId)
      .then((data) => {
        if (isMounted) {
          setReport(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'שגיאה בטעינת נתוני התלמיד');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin mx-auto mb-4" />
        <p className="text-base font-semibold text-slate-800">טוען תיק אישי ודיווחי שעות פרקטיקום...</p>
        <p className="text-xs text-slate-500 mt-1">מבצע שליפה מהשירות האנליטי</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-lg max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-bold">לא ניתן להציג את נתוני התלמיד</h3>
          <p className="text-xs text-rose-700 mt-1 mb-4">{error || 'התלמיד המבוקש לא נמצא במערכת.'}</p>
          <button
            onClick={onBack}
            className="text-xs bg-slate-900 text-white px-4 py-2 rounded font-semibold hover:bg-slate-800 transition"
          >
            חזרה לרשימת התלמידים
          </button>
        </div>
      </div>
    );
  }

  const { student, summary, events, manualEntries, contacts } = report;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 min-h-0 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Top Header Card combining Student Info & Compact Summary Metrics */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs mb-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Right Side: Back Button & Student Details */}
          <div className="flex-1">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition border border-slate-200 mb-2"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזרה לרשימת תלמידים</span>
            </button>

            {/* Main Heading */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {student.firstName} {student.lastName}
              </h2>

              {student.patternFlag && student.patternFlag !== 'normal' ? (
                <span className="bg-amber-100 text-amber-900 text-[11px] px-2 py-0.5 rounded font-bold border border-amber-300 flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  <span>נדרש עיון מנהלתי</span>
                </span>
              ) : (
                <span className="bg-teal-50 text-teal-800 text-[11px] px-2 py-0.5 rounded font-medium border border-teal-200 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-teal-700" />
                  <span>תיק פעיל תקין</span>
                </span>
              )}
            </div>

            {/* Student Meta Information Bar */}
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-2.5 text-xs text-slate-600 mt-2 font-medium">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>מחזור: <strong className="text-slate-900 font-bold">{student.className || 'לא צוין'}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>ת"ז: <strong className="text-slate-900 font-mono font-bold">{student.taz}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>דוא"ל: <strong className="text-slate-900 font-mono font-bold">{student.email}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                <span>הצהרה חתומה: <strong className="text-slate-900 font-bold">{(summary.signatureSubmitted ?? student.signatureSubmitted) ? 'הוגשה למזכירות' : 'טרם הוגשה למזכירות'}</strong></span>
              </div>
            </div>

          </div>

          {/* Left Side: Compact Summary Metrics (Category Counts & Unapproved Mentor Entries) */}
          <SummaryMetrics
            totalHours={summary.totalHours}
            clientHours={summary.clientHours}
            mentorApprovedHours={summary.mentorApprovedHours}
            mentorPendingHours={summary.mentorPendingHours}
            therapistHours={summary.therapistHours}
            manualHours={summary.manualHours}
            requiredQuota={summary.requiredQuota}
            submittedHours={summary.submittedHours || student.submittedHours}
            manualHoursByCategory={summary.manualHoursByCategory || student.manualHoursByCategory}
          />

        </div>

      </div>

      {/* Three Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-3 bg-white rounded-t-lg px-2 pt-1.5 border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveTab('markings')}
          className={`px-3.5 py-1.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'markings'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>סימונים</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-3.5 py-1.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'manual'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>שעות מנהלתיות</span>
          {manualEntries.length > 0 && (
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {manualEntries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-3.5 py-1.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>אנשי קשר</span>
          <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded font-mono">
            {(contacts.mentors?.length || 0) + (contacts.clients?.length || 0) + (contacts.therapists?.length || 0)}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'markings' && (
        <ActivityCalendar events={events} student={student} />
      )}

      {activeTab === 'manual' && (
        <ManualHoursTable
          manualEntries={manualEntries}
          totalManualHours={summary.manualHours}
        />
      )}

      {activeTab === 'contacts' && (
        <ContactsSection contacts={contacts} />
      )}

    </div>
  );
};

