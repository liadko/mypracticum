import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpLeft,
  BarChart3,
  BookOpen,
  Clock3,
  FileCheck2,
  Snowflake,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminPage.css";
import { StudentsForm } from "../../components/Admin/StudentsForm";
import { EntriesForm } from "../../components/Admin/EntriesForm";
import { ManualEntriesForm } from "../../components/Admin/ManualEntriesForm";
import { ClassManagementForm } from "../../components/Admin/ClassManagementForm";
import { FreezeStudentsForm } from "../../components/Admin/FreezeStudentsForm";

const tabs = [
  {
    id: "students",
    label: "הוספת סטודנטים",
    description: "הוספה אישית או ייבוא למחזור",
    icon: UserPlus,
  },
  {
    id: "classes",
    label: "מחזורי לימוד",
    description: "תאריכי דיווח ומכסות שעות",
    icon: BookOpen,
  },
  {
    id: "manual",
    label: "שעות מנהלתיות",
    description: "הזנת שעות לקבוצה או ליחידים",
    icon: Clock3,
  },
  {
    id: "status",
    label: "הקפאת חשבונות",
    description: "הקפאה והחזרה לפעילות",
    icon: Snowflake,
  },
  {
    id: "entries",
    label: "ניהול דיווחים",
    description: "אישור ומחיקת דיווחי שעות",
    icon: FileCheck2,
  },
] as const;
type AdminTab = (typeof tabs)[number]["id"];

export default function AdminPage() {
  const [logs, setLogs] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const { user, logout } = useAuth();
  const logMessage = useCallback((message: string) => {
    setLogs(
      (previous) =>
        `[${new Date().toLocaleTimeString("he-IL")}] ${message}\n${previous}`,
    );
  }, []);
  return (
    <div className="admin-shell" dir="rtl">
      <header className="admin-topbar">
        <Link className="admin-brand" to="/student">
          <img src="/logo-text.png" alt="תמורות" />
          <span>
            פרקטיקום<span>אזור הניהול</span>
          </span>
        </Link>
        <nav aria-label="ניווט באתר">
          <Link to="/student">
            לאתר הפרקטיקום
            <ArrowUpLeft size={17} />
          </Link>
          <Link to="/reports">
            <BarChart3 size={17} />
            דוחות ומעקב
          </Link>
        </nav>
        <div className="admin-account">
          <span>
            {user?.firstName} {user?.lastName}
          </span>
          <button
            type="button"
            className="admin-icon-button"
            onClick={logout}
            aria-label="יציאה מהמערכת"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">ניהול הפרקטיקום</p>
          <nav aria-label="כלי ניהול">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={21} strokeWidth={1.7} />
                <span>
                  {tab.label}
                  <small>{tab.description}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-note">
            תמורות · פרקטיקום
            <br />
            כל כלי הניהול במקום אחד
          </div>
        </aside>
        <main className="admin-main">
          <div className="admin-page-heading">
            <span>
              אזור הניהול / {tabs.find((tab) => tab.id === activeTab)?.label}
            </span>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <p>{tabs.find((tab) => tab.id === activeTab)?.description}</p>
          </div>
          {activeTab === "students" && <StudentsForm logMessage={logMessage} />}
          {activeTab === "classes" && (
            <ClassManagementForm logMessage={logMessage} />
          )}
          {activeTab === "manual" && (
            <ManualEntriesForm logMessage={logMessage} />
          )}
          {activeTab === "status" && (
            <FreezeStudentsForm logMessage={logMessage} />
          )}
          {activeTab === "entries" && <EntriesForm logMessage={logMessage} />}
          <details className="admin-logs">
            <summary>יומן פעולות ותוצאות {logs && <span>עודכן</span>}</summary>
            <div className="logs-header">
              <p>פרטי הפעולות מוצגים באנגלית לצורך מעקב ובירור.</p>
              <button
                type="button"
                className="admin-secondary"
                disabled={!logs}
                onClick={() => setLogs("")}
              >
                ניקוי היומן
              </button>
            </div>
            <pre id="log-output" dir="ltr">
              {logs || "No actions yet."}
            </pre>
          </details>
        </main>
      </div>
    </div>
  );
}
