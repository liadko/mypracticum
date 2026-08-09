import React from 'react';
import { X, Calendar, Clock, User, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { CATEGORY_CONFIGS } from '../types';
import type { ReportEvent } from '../types';

interface EventDetailModalProps {
  date: string;
  events: ReportEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  date,
  events,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDateHebrew = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const totalDayHours = events.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 dir-rtl">
      <div 
        className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">{formatDateHebrew(date)}</h3>
              <p className="text-xs text-slate-500">
                פירוט דיווחי שעות שנרשמו בתאריך זה ({totalDayHours} שעות בסה"כ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded border border-dashed border-slate-200">
              לא נרשמו דיווחים בתאריך זה.
            </div>
          ) : (
            events.map((event) => {
              const catConfig = CATEGORY_CONFIGS[event.category] || CATEGORY_CONFIGS.client;
              return (
                <div
                  key={event.id}
                  className={`p-3.5 rounded border ${catConfig.bgClass} transition border-slate-200`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${catConfig.badgeBg} ${catConfig.badgeText} ${catConfig.borderColor}`}
                    >
                      {catConfig.label}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {event.hours} {event.hours === 1 ? 'שעה' : 'שעות'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-800">
                    <div className="flex items-center space-x-1.5 space-x-reverse font-medium text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>גורם קשר: {event.contactName}</span>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse text-slate-600 pt-1">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="font-medium">סטאטוס:</span>
                        {event.approved ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            מאושר
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            ממתין לאישור מדריך
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="font-medium">מקור:</span>
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                          {event.source === 'manual' ? 'הזנה ידנית' : 'דיווח רגיל'}
                        </span>
                      </div>
                    </div>

                    {event.notes && (
                      <div className="mt-2 text-xs bg-white/80 p-2 rounded border border-slate-200/80 text-slate-700 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{event.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
