import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { StudentResponse } from "../../types";

export type Feedback = {
  kind: "success" | "error" | "info";
  text: string;
} | null;
export function AdminFeedback({ message }: { message: Feedback }) {
  return (
    message && (
      <div
        className={`admin-feedback admin-feedback--${message.kind}`}
        role={message.kind === "error" ? "alert" : "status"}
      >
        {message.text}
      </div>
    )
  );
}
export function SourceTabs({
  value,
  onChange,
}: {
  value: "list" | "csv";
  onChange: (value: "list" | "csv") => void;
}) {
  return (
    <div className="admin-source-tabs" aria-label="אופן בחירת הסטודנטים">
      <button
        type="button"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        בחירה מהרשימה
      </button>
      <button
        type="button"
        aria-pressed={value === "csv"}
        onClick={() => onChange("csv")}
      >
        ייבוא מקובץ או הדבקה
      </button>
    </div>
  );
}
export function CsvInput({
  value,
  onChange,
  description,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  description: string;
  id: string;
}) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(false);
  return (
    <div className="admin-csv-input">
      <p className="description">{description}</p>
      <label className="admin-file-picker">
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            try {
              onChange(await file.text());
              setFileName(file.name);
              setError(false);
            } catch {
              setError(true);
            }
            input.value = "";
          }}
        />
        <span>בחירת קובץ CSV</span>
        <small>{fileName || "או הדביקו נתונים בתיבה למטה"}</small>
      </label>
      {error && (
        <p className="form-error" role="alert">
          לא ניתן לקרוא את הקובץ. נסו שוב.
        </p>
      )}
      <label className="form-group" htmlFor={id}>
        הנתונים לייבוא
        <textarea
          id={id}
          className="uuids-input"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
export function StudentPicker({
  students,
  selected,
  onChange,
  hours,
  onHoursChange,
}: {
  students: StudentResponse[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  hours?: Record<string, string>;
  onHoursChange?: (id: string, value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [status, setStatus] = useState("all");
  const visible = useMemo(
    () =>
      students
        .filter((student) => {
          if (selectedOnly && !selected.has(student.id)) return false;
          if (status !== "all" && (student.status || "active") !== status)
            return false;
          return `${student.firstName} ${student.lastName} ${student.email} ${student.taz}`
            .toLowerCase()
            .includes(search.trim().toLowerCase());
        })
        .sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
            "he",
          ),
        ),
    [students, selected, search, status, selectedOnly],
  );
  const selectedStudents = students.filter((student) =>
    selected.has(student.id),
  );
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const allSelected =
    visible.length > 0 && visible.every((student) => selected.has(student.id));
  return (
    <div className="admin-student-picker">
      <div className="admin-picker-toolbar">
        <label className="admin-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, דוא״ל או תעודת זהות"
            aria-label="חיפוש סטודנטים"
          />
        </label>
        <select
          aria-label="מצב חשבון"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">כל הסטודנטים</option>
          <option value="active">פעילים</option>
          <option value="frozen">בהקפאה</option>
        </select>
      </div>
      <div className="admin-selection-bar">
        <strong>{selected.size} נבחרו</strong>
        <button
          type="button"
          className="admin-text-button"
          aria-pressed={selectedOnly}
          onClick={() => setSelectedOnly(!selectedOnly)}
        >
          {selectedOnly ? "הצגת כולם" : "הצגת הנבחרים בלבד"}
        </button>
        <button
          type="button"
          className="admin-text-button"
          disabled={!selected.size}
          onClick={() => onChange(new Set())}
        >
          ניקוי הבחירה
        </button>
      </div>
      {selectedStudents.length > 0 && (
        <div className="admin-selected-chips" aria-label="הסטודנטים שנבחרו">
          {selectedStudents.slice(0, 8).map((student) => (
            <button
              type="button"
              key={student.id}
              onClick={() => toggle(student.id)}
              aria-label={`הסרת ${student.firstName} ${student.lastName} מהבחירה`}
            >
              {student.firstName} {student.lastName}
              <X size={14} />
            </button>
          ))}
          {selectedStudents.length > 8 && (
            <span>ועוד {selectedStudents.length - 8}</span>
          )}
        </div>
      )}
      <div className="admin-list-heading">
        <span>
          {visible.length} תוצאות
          {onHoursChange && " · שעות לכל סטודנט בשדה שמשמאל"}
        </span>
        <button
          className="admin-text-button"
          type="button"
          disabled={!visible.length}
          onClick={() => {
            const next = new Set(selected);
            visible.forEach((student) =>
              allSelected ? next.delete(student.id) : next.add(student.id),
            );
            onChange(next);
          }}
        >
          {allSelected ? "ביטול בחירת התוצאות" : "בחירת כל התוצאות"}
        </button>
      </div>
      <div className="student-list-container">
        {!visible.length && (
          <p className="admin-empty">
            לא נמצאו סטודנטים. נסו לשנות את החיפוש או את הסינון.
          </p>
        )}
        {visible.map((student) => (
          <div
            key={student.id}
            className={`student-list-item${selected.has(student.id) ? " is-selected" : ""}`}
          >
            <label className="admin-student-choice">
              <input
                type="checkbox"
                checked={selected.has(student.id)}
                onChange={() => toggle(student.id)}
              />
              <span className="student-info">
                <span className="name">
                  {student.firstName} {student.lastName}
                  {student.status === "frozen" && (
                    <span className="admin-status-chip">בהקפאה</span>
                  )}
                </span>
                <span className="email" dir="ltr">
                  {student.email}
                </span>
                <span className="taz">
                  ת״ז: <bdi>{student.taz || "לא הוזנה"}</bdi>
                </span>
              </span>
              {selected.has(student.id) && (
                <Check
                  className="admin-selected-mark"
                  size={18}
                  aria-hidden="true"
                />
              )}
            </label>
            {onHoursChange && (
              <label className="admin-hours-cell">
                <span>שעות</span>
                <input
                  type="number"
                  step="1"
                  value={hours?.[student.id] ?? "10"}
                  disabled={!selected.has(student.id)}
                  onChange={(e) => onHoursChange(student.id, e.target.value)}
                  aria-label={`שעות עבור ${student.firstName} ${student.lastName}`}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
