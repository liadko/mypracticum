import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Filter, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';
import { CATEGORY_CONFIGS } from '../types';
import type { ReportEvent, CategoryKey, StudentSummary } from '../types';

interface ActivityCalendarProps {
  events: ReportEvent[];
  student?: StudentSummary;
  title?: string;
  hideCategoryFilter?: boolean;
}

const HEBREW_MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const HEBREW_WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  events,
  student,
  title = 'יומן דיווחי פעילות',
  hideCategoryFilter = false,
}) => {
  // Default to August 2026 or month of newest event
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed (7 = August)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    let list = events;
    if (selectedCategory !== 'all') {
      list = events.filter((e) => e.category === selectedCategory);
    }
    // Sort descending by date
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [events, selectedCategory]);

  // Handle entry list row click -> selects date and switches calendar to that month/year if needed
  const handleEntryClick = (dateStr: string) => {
    setSelectedDate(dateStr);

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        setCurrentYear(year);
        setCurrentMonth(month);
      }
    }
  };

  // Handle calendar day click -> selects date and scrolls left list
  const handleDayClick = (dateStr: string, hasEvents: boolean) => {
    if (!hasEvents) return;
    setSelectedDate(dateStr);

    // Scroll entries list to the matching entry
    setTimeout(() => {
      const el = document.getElementById(`entry-${dateStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Map events by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, ReportEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Build calendar matrix for currentYear & currentMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const matrix: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: ReportEvent[];
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(pDay).padStart(2, '0');
      const dateStr = `${prevYear}-${mStr}-${dStr}`;

      matrix.push({
        dateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;

      matrix.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(n).padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;

      matrix.push({
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        events: eventsByDate[dateStr] || [],
      });
    }

    return matrix;
  }, [currentYear, currentMonth, eventsByDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(7); // August 2026
  };

  // Pattern Flag Alert
  const patternFlag = student?.patternFlag;
  const patternText = student?.patternFlagText;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs mb-3">
      
      {/* Pattern Warning Banner if applicable */}
      {patternFlag && patternFlag !== 'normal' && (
        <div className={`p-2.5 rounded border mb-3 flex items-start gap-2 ${
          patternFlag === 'suspicious_concentration' 
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : patternFlag === 'sparse_activity'
            ? 'bg-sky-50 border-sky-300 text-sky-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block">
              {patternFlag === 'suspicious_concentration' && 'התראה מנהלתית: דפוס דיווח מרוכז חריג'}
              {patternFlag === 'sparse_activity' && 'התראה מנהלתית: פעילות דלילה ופער בדיווחים'}
              {patternFlag === 'pending_approval_backlog' && 'התראה מנהלתית: צבר ממתין חריג לאישור מדריך'}
            </span>
            <span className="mt-0.5 block opacity-90">{patternText}</span>
          </div>
        </div>
      )}

      {/* Calendar Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-100">
        
        {/* Title & Month Navigation */}
        <div className="flex items-center space-x-2.5 space-x-reverse flex-wrap gap-y-2">
          <CalendarIcon className="w-4 h-4 text-teal-700 shrink-0" />
          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          <div className="flex items-center bg-slate-100 rounded border border-slate-200 p-0.5 mr-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded text-slate-700 transition"
              title="חודש קודם"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 text-xs font-bold text-slate-900 min-w-24 text-center">
              {HEBREW_MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded text-slate-700 transition"
              title="חודש הבא"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-300 font-medium transition"
          >
            היום
          </button>

          {/* Quick Month Dropdown */}
          <select
            value={`${currentYear}-${currentMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              setCurrentYear(y);
              setCurrentMonth(m);
            }}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="2026-7">אוגוסט 2026</option>
            <option value="2026-6">יולי 2026</option>
            <option value="2026-5">יוני 2026</option>
            <option value="2026-4">מאי 2026</option>
            <option value="2026-3">אפריל 2026</option>
            <option value="2026-2">מרץ 2026</option>
            <option value="2026-1">פברואר 2026</option>
            <option value="2026-0">ינואר 2026</option>
            <option value="2025-11">דצמבר 2025</option>
            <option value="2025-10">נובמבר 2025</option>
          </select>
        </div>

        {/* Filter Category Pills */}
        {!hideCategoryFilter && (
          <div className="flex items-center space-x-1 space-x-reverse flex-wrap gap-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1 ml-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              סינון:
            </span>

            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-2 py-0.5 rounded transition border font-medium ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              הכל ({events.length})
            </button>

            {(Object.keys(CATEGORY_CONFIGS) as CategoryKey[]).map((catKey) => {
              const conf = CATEGORY_CONFIGS[catKey];
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`text-xs px-2.5 py-1 rounded transition border font-medium flex items-center gap-1.5 ${
                    isSelected
                      ? `${conf.badgeBg} ${conf.badgeText} ${conf.borderColor} font-bold`
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${conf.dotColor} shrink-0`} />
                  <span>{conf.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Layout Split: 2/3 Calendar (Right), 1/3 Entry List (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Right 2/3 Column: Calendar */}
        <div className="lg:col-span-2">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center font-bold text-xs text-slate-700 bg-slate-100/80 rounded-t py-1">
            {HEBREW_WEEKDAYS.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 border-r border-b border-slate-200 bg-slate-200 gap-px">
            {calendarDays.map((cell, idx) => {
              const hasEvents = cell.events.length > 0;
              const isSelected = selectedDate === cell.dateStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => {
                    handleDayClick(cell.dateStr, hasEvents);
                  }}
                  className={`min-h-[58px] p-1 bg-white flex flex-col justify-between transition ${
                    cell.isCurrentMonth ? 'text-slate-900' : 'text-slate-300 bg-slate-50/50'
                  } ${
                    hasEvents ? 'cursor-pointer hover:bg-teal-50/50' : 'cursor-default'
                  } ${
                    isSelected ? 'ring-2 ring-teal-500 ring-inset bg-teal-50/70' : ''
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-xs sm:text-sm px-0.5 rounded ${
                        cell.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasEvents && (
                      <span className="text-[10px] font-bold px-1 py-0.2 bg-teal-100 text-teal-800 rounded border border-teal-200">
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  {/* Event indicators - enlarged clear badges */}
                  <div className="space-y-0.5 mt-0.5">
                    {cell.events.slice(0, 2).map((ev) => {
                      const conf = CATEGORY_CONFIGS[ev.category] || CATEGORY_CONFIGS.client;
                      const isMentor = ev.category === 'mentor';
                      const isApproved = ev.approved !== false;

                      return (
                        <div
                          key={ev.id}
                          className={`text-[10px] sm:text-[11px] px-1 py-0.2 rounded truncate border ${conf.badgeBg} ${conf.badgeText} ${conf.borderColor} flex items-center justify-between font-medium gap-1`}
                          title={`${conf.shortLabel}: ${ev.contactName} ${isMentor ? (isApproved ? '(מאושר)' : '(ממתין לאישור)') : ''}`}
                        >
                          <span className="truncate">{ev.contactName}</span>
                          {isMentor && (
                            isApproved ? (
                              <span className="shrink-0 text-emerald-700 font-bold text-[9px] bg-emerald-100/90 px-1 rounded" title="מאושר">✓</span>
                            ) : (
                              <span className="shrink-0 text-amber-900 font-bold text-[9px] bg-amber-200 px-1 py-0.2 rounded border border-amber-300 flex items-center gap-0.5" title="ממתין לאישור">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                              </span>
                            )
                          )}
                        </div>
                      );
                    })}

                    {cell.events.length > 2 && (
                      <div className="text-[9px] text-teal-800 font-bold text-center">
                        +{cell.events.length - 2} נוספים
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left 1/3 Column: Filtered Entries List */}
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col h-[350px] shadow-2xs">
          
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 shrink-0">
            <h4 className="text-xs font-bold text-slate-800">
              רשימת סימונים ({filteredEvents.length})
            </h4>
            <span className="text-[10px] text-slate-500">בחירת יום לגלילה</span>
          </div>

          {/* Scrollable Entry Items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                אין דיווחים להצגה בקטגוריה הנבחרת
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const conf = CATEGORY_CONFIGS[ev.category] || CATEGORY_CONFIGS.client;
                const isSelected = selectedDate === ev.date;
                const isMentor = ev.category === 'mentor';
                const isApproved = ev.approved !== false;

                return (
                  <div
                    key={ev.id}
                    id={`entry-${ev.date}`}
                    onClick={() => {
                      handleEntryClick(ev.date);
                    }}
                    className={`p-2 bg-white rounded border transition cursor-pointer hover:shadow-2xs ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-400/50 bg-teal-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {ev.date}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {ev.hours} ש'
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${conf.badgeBg} ${conf.badgeText} ${conf.borderColor}`}>
                          {conf.shortLabel}
                        </span>

                        {isMentor && (
                          isApproved ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>מאושר</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>ממתין לאישור</span>
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-1">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        {ev.contactName}
                      </span>
                      {ev.notes && (
                        <span className="text-[11px] text-slate-500 line-clamp-1 block mt-0.5">
                          {ev.notes}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Legend & Footnote */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4 flex-wrap gap-y-1">
          <span className="font-bold text-slate-800">מקרא קטגוריות:</span>
          {(Object.keys(CATEGORY_CONFIGS) as CategoryKey[]).map((k) => {
            const conf = CATEGORY_CONFIGS[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${conf.dotColor} shrink-0`} />
                <span className="font-medium text-slate-700">{conf.shortLabel}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>לחץ על יום בלוח להתמקדות ברשימת הדיווחים.</span>
        </div>
      </div>

    </div>
  );
};
