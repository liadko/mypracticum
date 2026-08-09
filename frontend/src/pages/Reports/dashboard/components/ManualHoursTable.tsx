import React from 'react';
import { Wrench, Info } from 'lucide-react';
import { CATEGORY_CONFIGS } from '../types';
import type { ManualEntry } from '../types';

interface ManualHoursTableProps {
  manualEntries: ManualEntry[];
  totalManualHours: number;
}

export const ManualHoursTable: React.FC<ManualHoursTableProps> = ({
  manualEntries,
  totalManualHours,
}) => {
  // Group totals by category
  const clientManualTotal = manualEntries
    .filter((m) => m.category === 'client')
    .reduce((sum, m) => sum + m.hours, 0);

  const mentorManualTotal = manualEntries
    .filter((m) => m.category === 'mentor')
    .reduce((sum, m) => sum + m.hours, 0);

  const therapistManualTotal = manualEntries
    .filter((m) => m.category === 'therapist')
    .reduce((sum, m) => sum + m.hours, 0);

  return (
    <div className="bg-white rounded border border-slate-200 p-3.5 shadow-2xs mb-3">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Wrench className="w-4 h-4 text-slate-700 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              התאמות וזיכויים ידניים (שעות מנהלתיות)
            </h3>
            <p className="text-[11px] text-slate-500">
              פירוט אישורים מיוחדים, פטורים מנהלתיים וזיכויי עבר שאינם מופיעים כדיווח יומיומי בלוח
            </p>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-200 text-slate-900 text-xs px-2.5 py-1 rounded font-bold self-start sm:self-auto">
          סה"כ שעות ידניות: {totalManualHours} שעות
        </div>
      </div>

      {/* Institutional Notice Box */}
      <div className="bg-slate-50 border border-slate-200 p-2 rounded text-[11px] text-slate-700 mb-3 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">הערה מנהלתית: </span>
          שעות ידניות מזינות זיכויים מנהלתיים קבועים (כגון הכשרה קודמת מוכרת, כנסים מקצועיים או פטורי ועדת הוראה). 
          הן מחושבות בסיכום השעות הכולל, אך אינן מייצגות טיפולים יומיים ביומן.
        </div>
      </div>

      {/* Category Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        
        <div className="p-2 bg-teal-50/70 border border-teal-200 rounded flex justify-between items-center">
          <div>
            <span className="text-[11px] font-medium text-teal-900 block">מטופלים פרטיים (זיכוי ידני)</span>
            <span className="text-base font-bold text-teal-950">{clientManualTotal} שעות</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
        </div>

        <div className="p-2 bg-sky-50/70 border border-sky-200 rounded flex justify-between items-center">
          <div>
            <span className="text-[11px] font-medium text-sky-900 block">הדרכה (זיכוי ידני)</span>
            <span className="text-base font-bold text-sky-950">{mentorManualTotal} שעות</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
        </div>

        <div className="p-2 bg-amber-50/70 border border-amber-200 rounded flex justify-between items-center">
          <div>
            <span className="text-[11px] font-medium text-amber-900 block">טיפול אישי (זיכוי ידני)</span>
            <span className="text-base font-bold text-amber-950">{therapistManualTotal} שעות</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
        </div>

      </div>

      {/* Entries Table */}
      {manualEntries.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded text-slate-500 text-xs">
          לא קיימים רישומים ידניים עבור תלמיד זה.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-200 rounded">
          <table className="w-full text-xs text-slate-800 text-right">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-2.5 py-1.5">עילה / כותרת זיכוי</th>
                <th className="px-2.5 py-1.5">קטגוריה</th>
                <th className="px-2.5 py-1.5">מספר שעות</th>
                <th className="px-2.5 py-1.5">תאריך יצירה</th>
                <th className="px-2.5 py-1.5">מזהה רשומה (ID)</th>
                <th className="px-2.5 py-1.5">גורם מאשר</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {manualEntries.map((entry) => {
                const catConf = CATEGORY_CONFIGS[entry.category] || CATEGORY_CONFIGS.client;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="px-2.5 py-1.5 font-medium text-slate-900 max-w-xs">
                      {entry.title}
                      {entry.notes && (
                        <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                          {entry.notes}
                        </span>
                      )}
                    </td>

                    <td className="px-2.5 py-1.5">
                      <span
                        className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${catConf.badgeBg} ${catConf.badgeText} ${catConf.borderColor}`}
                      >
                        {catConf.shortLabel}
                      </span>
                    </td>

                    <td className="px-2.5 py-1.5 font-bold text-slate-900">
                      {entry.hours} שעות
                    </td>

                    <td className="px-2.5 py-1.5 text-slate-600 font-mono text-[11px]">
                      {entry.createdAt}
                    </td>

                    <td className="px-2.5 py-1.5 text-slate-500 font-mono text-[11px]">
                      {entry.id ? (
                        <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200">
                          {entry.id}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-2.5 py-1.5 text-slate-700 text-[11px]">
                      {entry.approvedBy || 'מנהלת הפרקטיקום האקדמית'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
