import type { ReactNode } from 'react';
import { Search, X, Loader2, AlertTriangle, ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'right' | 'center' | 'left';
  width?: string;
  render: (item: T) => ReactNode;
}

interface PaginatedDirectoryProps<T> {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  
  // Search & Filter state
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder?: string;
  extraFilters?: ReactNode;
  isFiltered?: boolean;
  onClearFilters: () => void;

  // Items & Table state
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  
  columns: ColumnDef<T>[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRowClick?: (item: T) => void;
  
  // States
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  emptyText?: string;
  itemKey: (item: T) => string;
}

export function PaginatedDirectory<T>({
  title,
  subtitle,
  icon,
  query,
  onQueryChange,
  searchPlaceholder = 'חיפוש...',
  extraFilters,
  isFiltered = false,
  onClearFilters,
  items,
  total,
  page,
  totalPages,
  onPageChange,
  columns,
  sortBy,
  sortDirection,
  onSort,
  onRowClick,
  loading,
  error,
  onRetry,
  emptyText = 'לא נמצאו נתונים',
  itemKey,
}: PaginatedDirectoryProps<T>) {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 min-h-0 flex flex-col overflow-hidden dir-rtl">
      
      {/* Page Title & Intro */}
      <div className="shrink-0 mb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {icon}
              <span>{title}</span>
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Search & Filter Control Bar */}
      <div className="shrink-0 bg-white rounded-lg border border-slate-200 p-3 shadow-2xs mb-3">
        {/* Search Input Field */}
        <div className="relative mb-2">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Extra Filters slot if provided */}
        {extraFilters && (
          <div className="mb-2">
            {extraFilters}
          </div>
        )}

        {/* Counter & Clear filters button */}
        <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-slate-100 text-slate-500 text-xs">
          <span>
            סה"כ נמצאו <strong className="text-slate-900 font-bold">{total}</strong> תוצאות
          </span>
          {(query || isFiltered) && (
            <button
              onClick={onClearFilters}
              className="text-teal-700 hover:text-teal-900 hover:underline font-semibold transition"
            >
              איפוס מסננים
            </button>
          )}
        </div>
      </div>

      {/* Results Table / Container */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {error ? (
          <div className="py-16 text-center px-4 flex-1 flex flex-col justify-center items-center bg-rose-50/30">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">שגיאה בתקשורת עם השרת (API)</h3>
            <p className="text-xs text-rose-800 max-w-md mx-auto mt-1 mb-4 font-medium">
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-slate-900 text-white px-4 py-2 rounded font-semibold hover:bg-slate-800 transition"
              >
                נסה לטעון מחדש
              </button>
            )}
          </div>
        ) : loading && items.length === 0 ? (
          <div className="py-16 text-center px-4 flex-1 flex flex-col justify-center items-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700 mb-2" />
            <span className="text-xs font-medium text-slate-600">טוען נתונים מהשרת...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-4 flex-1 flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{emptyText}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              נסה לשנות את מילות החיפוש או לבטל מסננים קיימים.
            </p>
            {(query || isFiltered) && (
              <button
                onClick={onClearFilters}
                className="text-xs bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded font-medium hover:bg-slate-200 transition"
              >
                נקה סינון
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto border-b border-slate-200 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
              </div>
            )}
            <table className="w-full text-xs text-slate-800 text-right">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider sticky top-0 z-10 select-none">
                <tr>
                  {columns.map((col) => {
                    const isSorted = sortBy === col.key;
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'left'
                        ? 'text-left'
                        : 'text-right';

                    return (
                      <th
                        key={col.key}
                        style={{ width: col.width }}
                        className={`px-3 py-2.5 ${alignClass} ${
                          col.sortable ? 'cursor-pointer hover:bg-slate-200 transition' : ''
                        }`}
                        onClick={() => col.sortable && onSort(col.key)}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            col.align === 'center'
                              ? 'justify-center'
                              : col.align === 'left'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-teal-700" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-teal-700" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-50" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={itemKey(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-teal-50/40 transition ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${itemKey(item)}-${col.key}`}
                        className={`px-3 py-2.5 whitespace-nowrap ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'left'
                            ? 'text-left'
                            : 'text-right'
                        }`}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="shrink-0 bg-slate-50 px-4 py-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            <span>
              מציג <strong>{items.length}</strong> מתוך <strong>{total}</strong> תוצאות
            </span>
          </div>

          <div className="flex items-center space-x-1 space-x-reverse">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              title="עמוד קודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium text-slate-800">
              עמוד {page} מתוך {totalPages || 1}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              title="עמוד הבא"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
