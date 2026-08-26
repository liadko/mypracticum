import React, { useEffect, useState } from 'react';
import { Users, Phone, Mail, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MentorContact, ClientContact, TherapistContact } from '../types';

interface ContactsSectionProps {
  contacts: {
    mentors: MentorContact[];
    clients: ClientContact[];
    therapists: TherapistContact[];
  };
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({ contacts }) => {
  const mentorsCount = contacts.mentors.length;
  const clientsCount = contacts.clients.length;
  const therapistsCount = contacts.therapists.length;
  const [activeTab, setActiveTab] = useState<'mentors' | 'clients' | 'therapists'>(
    mentorsCount > 0 ? 'mentors' : clientsCount > 0 ? 'clients' : 'therapists'
  );

  useEffect(() => {
    const hasActiveItems =
      activeTab === 'mentors' ? mentorsCount > 0 :
      activeTab === 'clients' ? clientsCount > 0 :
      therapistsCount > 0;

    if (hasActiveItems) return;
    if (mentorsCount > 0) setActiveTab('mentors');
    else if (clientsCount > 0) setActiveTab('clients');
    else setActiveTab('therapists');
  }, [activeTab, mentorsCount, clientsCount, therapistsCount]);

  return (
    <div className="bg-white rounded border border-slate-200 p-3.5 shadow-2xs mb-3">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Users className="w-4 h-4 text-teal-700 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              אנשי קשר קליניים ומקורות הדרכה
            </h3>
            <p className="text-[11px] text-slate-500">
              ריכוז מדריכים, מטופלים ומטפלים אישיים המקושרים לדיווחים הקליניים
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
          {mentorsCount > 0 && <button
            onClick={() => setActiveTab('mentors')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              activeTab === 'mentors'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>מדריכים ({mentorsCount})</span>
          </button>}

          {clientsCount > 0 && <button
            onClick={() => setActiveTab('clients')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              activeTab === 'clients'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>מטופלים ({clientsCount})</span>
          </button>}

          {therapistsCount > 0 && <button
            onClick={() => setActiveTab('therapists')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              activeTab === 'therapists'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>מטפלים אישיים ({therapistsCount})</span>
          </button>}
        </div>
      </div>

      {/* Tab 1: Mentors */}
      {activeTab === 'mentors' && (
        <div>
          {contacts.mentors.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 border border-dashed border-slate-200 rounded">
              אין מדריכים רשומים במערכת.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-slate-800 text-right">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-1.5">שם המדריך/ה</th>
                    <th className="px-2.5 py-1.5">התמחות קלינית</th>
                    <th className="px-2.5 py-1.5">דוא"ל / טלפון</th>
                    <th className="px-2.5 py-1.5">שעות מאושרות</th>
                    <th className="px-2.5 py-1.5">שעות ממתינות לאישור</th>
                    <th className="px-2.5 py-1.5">סה"כ שעות הדרכה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contacts.mentors.map((m) => {
                    const totalM = m.approvedHours + m.pendingHours;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-bold text-slate-900">
                          {m.name}
                          {m.licenseNumber && (
                            <span className="block text-[11px] text-slate-500 font-normal">
                              {m.licenseNumber}
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 text-slate-700">
                          {m.specialty || 'פסיכותרפיה כללית'}
                        </td>

                        <td className="p-2.5 text-slate-600 space-y-0.5">
                          {m.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[11px]">{m.email}</span>
                            </div>
                          )}
                          {m.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[11px]">{m.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-2.5 font-bold text-teal-800">
                          <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            {m.approvedHours} ש'
                          </span>
                        </td>

                        <td className="p-2.5 font-bold">
                          {m.pendingHours > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              {m.pendingHours} ש'
                            </span>
                          ) : (
                            <span className="text-slate-400">0 ש'</span>
                          )}
                        </td>

                        <td className="p-2.5 font-bold text-slate-900">
                          {totalM} שעות
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Clients */}
      {activeTab === 'clients' && (
        <div>
          {contacts.clients.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 border border-dashed border-slate-200 rounded">
              אין מטופלים רשומים.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-slate-800 text-right">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-1.5">קוד אנונימי / מזהה מטופל</th>
                    <th className="px-2.5 py-1.5">מוסד טיפולי / מרפאה</th>
                    <th className="px-2.5 py-1.5">תחנת הכשרה / פרקטיקום</th>
                    <th className="px-2.5 py-1.5">קבוצת גיל</th>
                    <th className="px-2.5 py-1.5">שעות טיפול שנצברו</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {contacts.clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-2.5 py-1.5 font-bold text-slate-900">
                        {c.name}
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-700 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.institution || 'מרפאה ציבורית להתפתחות הילד והילד'}</span>
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-600">
                        {c.trainingCenterInfo || 'מרכז הכשרה אזורי'}
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-600">
                        {c.ageGroup || 'מבוגרים'}
                      </td>

                      <td className="px-2.5 py-1.5 font-bold text-teal-800">
                        {c.hours} שעות
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Personal Therapists */}
      {activeTab === 'therapists' && (
        <div>
          {contacts.therapists.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 border border-dashed border-slate-200 rounded">
              אין מטפלים אישיים רשומים.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-slate-800 text-right">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-2.5 py-1.5">שם המטפל/ת האישי/ת</th>
                    <th className="px-2.5 py-1.5">התמחות וגישה</th>
                    <th className="px-2.5 py-1.5">טלפון</th>
                    <th className="px-2.5 py-1.5">כתובת קלינאי/ת</th>
                    <th className="px-2.5 py-1.5">סה"כ שעות טיפול אישי</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {contacts.therapists.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-2.5 py-1.5 font-bold text-slate-900">
                        {t.name}
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-700">
                        {t.specialty || 'פסיכותרפיה אישית'}
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-600 font-mono text-[11px]">
                        {t.phone || '050-0000000'}
                      </td>

                      <td className="px-2.5 py-1.5 text-slate-600">
                        {t.clinicAddress || 'קליניקה פרטית'}
                      </td>

                      <td className="px-2.5 py-1.5 font-bold text-amber-800">
                        {t.hours} שעות
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
