import React from 'react';
import { Users, UserCheck, LogOut } from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface HeaderProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentView: 'list' | 'details';
  onNavigateList?: () => void;
  onRefreshData?: () => void;
  onExit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentView,
  onNavigateList,
  onExit,
}) => {
  const tabs: TabConfig[] = [
    {
      id: 'students',
      label: 'תלמידים',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'mentors',
      label: 'מדריכים',
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Right side: Branding & Tab Navigation */}
          <div className="flex items-center gap-6">
            <div
              onClick={onNavigateList}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="דשבורד אנליסט - תמורות פרקטיקום"
            >
              <div className="w-8 h-8 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:bg-teal-800 transition">
                ת
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-teal-800 transition">
                    תמורות פרקטיקום
                  </h1>
                  <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.2 rounded border border-slate-300 font-medium hidden sm:inline-block">
                    דשבורד אנליסט
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <nav className="flex items-center space-x-1 space-x-reverse bg-slate-100 p-1 rounded-lg border border-slate-200">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      isActive
                        ? 'bg-white text-teal-800 shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Left side: Quick actions */}
          <div className="flex items-center space-x-2.5 space-x-reverse">
            {onExit && (
              <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition border border-slate-200 font-medium">
                <LogOut className="w-3.5 h-3.5" />
                <span>חזרה לאתר</span>
              </button>
            )}
            
            {/* Return to List shortcut when in detail view */}
            {currentView === 'details' && onNavigateList && (
              <button
                onClick={onNavigateList}
                className="flex items-center space-x-1.5 space-x-reverse text-xs text-slate-600 hover:text-teal-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition border border-slate-200 font-medium"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>חזרה לרשימה</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
