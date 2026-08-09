import React from 'react';
import { CheckCircle2, Heart, Clock } from 'lucide-react';

interface SummaryMetricsProps {
  totalHours: number;
  clientHours: number;
  mentorApprovedHours: number;
  mentorPendingHours: number;
  therapistHours: number;
  manualHours: number;
  requiredQuota?: number;
  submittedHours?: {
    client: number;
    mentorApproved: number;
    mentorPending: number;
    therapist: number;
  };
  manualHoursByCategory?: {
    client?: number;
    mentor?: number;
    therapist?: number;
  };
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  clientHours,
  mentorApprovedHours,
  mentorPendingHours,
  therapistHours,
  submittedHours,
  manualHoursByCategory,
}) => {
  // Client split
  const clientManual = manualHoursByCategory?.client || 0;
  const clientSubmitted = submittedHours?.client ?? (clientHours - clientManual);

  // Mentor split
  const mentorManual = manualHoursByCategory?.mentor || 0;
  const mentorSubmitted = submittedHours?.mentorApproved ?? (mentorApprovedHours - mentorManual);

  // Therapist split
  const therapistManual = manualHoursByCategory?.therapist || 0;
  const therapistSubmitted = submittedHours?.therapist ?? (therapistHours - therapistManual);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
      
      {/* 1. Client Hours (Max 300) */}
      <div className="relative group cursor-pointer">
        <div className="bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 rounded p-2 text-right min-w-[130px] flex flex-col justify-between transition shadow-2xs">
          <div className="flex items-center justify-between text-teal-900 text-[11px] font-bold">
            <span>1. מטופלים פרטיים</span>
            <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-bold text-teal-950 font-mono flex items-center justify-between">
              <span>{clientHours} <span className="text-[10px] font-normal text-slate-500">/ 300</span></span>
            </div>
            <div className="w-full bg-teal-200/70 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-teal-700 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (clientHours / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hover Modal Popover - Client Split */}
        <div className="absolute top-full right-0 mt-1.5 z-40 hidden group-hover:block w-56 p-3 bg-white rounded-lg border border-slate-200 shadow-xl text-xs text-slate-800 dir-rtl animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold border-b border-slate-100 pb-1.5 mb-2 text-teal-900 flex justify-between items-center">
            <span>פירוט שעות: מטופלים פרטיים</span>
            <span className="w-2 h-2 rounded-full bg-teal-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>דיווח שוטף (משתמש):</span>
              <span className="font-mono font-bold text-slate-900">{clientSubmitted} ש'</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>התאמה מנהלתית (ידני):</span>
              <span className="font-mono font-bold text-teal-700">{clientManual} ש'</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 font-bold text-slate-900">
              <span>סה"כ בקטגוריה:</span>
              <span className="font-mono text-teal-900">{clientHours} ש'</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mentor Approved Hours (Max 100) */}
      <div className="relative group cursor-pointer">
        <div className="bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200 rounded p-2 text-right min-w-[130px] flex flex-col justify-between transition shadow-2xs">
          <div className="flex items-center justify-between text-sky-900 text-[11px] font-bold">
            <span>2. הדרכה</span>
            <CheckCircle2 className="w-3 h-3 text-sky-700 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-bold text-sky-950 font-mono flex items-center justify-between">
              <span>{mentorApprovedHours} <span className="text-[10px] font-normal text-slate-500">/ 100</span></span>
            </div>
            <div className="w-full bg-sky-200/70 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (mentorApprovedHours / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hover Modal Popover - Mentor Split */}
        <div className="absolute top-full right-0 mt-1.5 z-40 hidden group-hover:block w-56 p-3 bg-white rounded-lg border border-slate-200 shadow-xl text-xs text-slate-800 dir-rtl animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold border-b border-slate-100 pb-1.5 mb-2 text-sky-900 flex justify-between items-center">
            <span>פירוט שעות: הדרכה</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>דיווח שוטף (משתמש):</span>
              <span className="font-mono font-bold text-slate-900">{mentorSubmitted} ש'</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>התאמה מנהלתית (ידני):</span>
              <span className="font-mono font-bold text-sky-700">{mentorManual} ש'</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 font-bold text-slate-900">
              <span>סה"כ מאושר:</span>
              <span className="font-mono text-sky-900">{mentorApprovedHours} ש'</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Personal Therapy Hours (Max 150) */}
      <div className="relative group cursor-pointer">
        <div className="bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded p-2 text-right min-w-[130px] flex flex-col justify-between transition shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-[11px] font-bold">
            <span>3. טיפול אישי</span>
            <Heart className="w-3 h-3 text-amber-600 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-bold text-amber-950 font-mono flex items-center justify-between">
              <span>{therapistHours} <span className="text-[10px] font-normal text-slate-500">/ 150</span></span>
            </div>
            <div className="w-full bg-amber-200/70 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-amber-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (therapistHours / 150) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hover Modal Popover - Therapist Split */}
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-1.5 z-40 hidden group-hover:block w-56 p-3 bg-white rounded-lg border border-slate-200 shadow-xl text-xs text-slate-800 dir-rtl animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold border-b border-slate-100 pb-1.5 mb-2 text-amber-900 flex justify-between items-center">
            <span>פירוט שעות: טיפול אישי</span>
            <Heart className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>דיווח שוטף (משתמש):</span>
              <span className="font-mono font-bold text-slate-900">{therapistSubmitted} ש'</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>התאמה מנהלתית (ידני):</span>
              <span className="font-mono font-bold text-amber-700">{therapistManual} ש'</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 font-bold text-slate-900">
              <span>סה"כ בקטגוריה:</span>
              <span className="font-mono text-amber-900">{therapistHours} ש'</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mentor Pending Approval */}
      <div className={`border rounded p-2 text-right min-w-[130px] flex flex-col justify-between transition shadow-2xs ${
        mentorPendingHours > 0
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span>4. ממתין להדרכה</span>
          <Clock className={`w-3.5 h-3.5 ${mentorPendingHours > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
        </div>
        <div className="mt-1">
          <div className="text-sm font-bold font-mono">
            {mentorPendingHours} <span className="text-[10px] font-normal text-slate-600">ש'</span>
          </div>
          <div className="text-[10px] font-medium opacity-90 mt-0.5 truncate flex items-center gap-1">
            {mentorPendingHours > 0 ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                ממתין לאישור
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                הכל מאושר
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
