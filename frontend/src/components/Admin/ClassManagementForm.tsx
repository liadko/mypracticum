import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import * as adminApi from "../../api/adminApi";
import type { AdminClass, CreateAdminClassRequest } from "../../types";
import { AdminFeedback, type Feedback } from "./AdminShared";

type Dates = CreateAdminClassRequest["reportingStartDates"];
const blankDates: Dates = { client: "", mentor: "", therapist: "" };
const dateLabels: Record<keyof Dates, string> = {
  client: "טיפול במטופלים",
  mentor: "הדרכה אישית",
  therapist: "טיפול אישי",
};
const showDate = (iso: string | null) =>
  iso ? iso.split("-").reverse().join("/") : "";
function parseDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null;
}
const datesFromClass = (item: AdminClass): Dates => ({
  client: showDate(item.reportingStartDates.client),
  mentor: showDate(item.reportingStartDates.mentor),
  therapist: showDate(item.reportingStartDates.therapist),
});
function parsedDates(dates: Dates): Dates | null {
  const client = parseDate(dates.client),
    mentor = parseDate(dates.mentor),
    therapist = parseDate(dates.therapist);
  return client && mentor && therapist ? { client, mentor, therapist } : null;
}
function DateFields({
  dates,
  onChange,
  prefix,
}: {
  dates: Dates;
  onChange: (value: Dates) => void;
  prefix: string;
}) {
  return (
    <div className="date-fields">
      {(Object.keys(dateLabels) as (keyof Dates)[]).map((key) => {
        const iso = parseDate(dates[key]);
        return (
          <label className="form-group" key={key} htmlFor={`${prefix}-${key}`}>
            {dateLabels[key]}
            <input
              className="admin-date-input"
              id={`${prefix}-${key}`}
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              value={dates[key]}
              onChange={(e) => onChange({ ...dates, [key]: e.target.value })}
              aria-invalid={!!dates[key] && !iso}
              required
              maxLength={10}
            />
            <span
              className={dates[key] && !iso ? "form-error" : "admin-date-hint"}
            >
              {iso
                ? new Intl.DateTimeFormat("he-IL", {
                    dateStyle: "full",
                    timeZone: "UTC",
                  }).format(new Date(`${iso}T00:00:00Z`))
                : dates[key]
                  ? "יש להזין תאריך תקין: יום/חודש/שנה"
                  : "יום / חודש / שנה"}
            </span>
          </label>
        );
      })}
    </div>
  );
}
function ClassEditor({
  item,
  onSaved,
  logMessage,
}: {
  item: AdminClass;
  onSaved: (item: AdminClass) => void;
  logMessage: (message: string) => void;
}) {
  const [dates, setDates] = useState<Dates>(() => datesFromClass(item));
  const [cap, setCap] = useState(String(item.privateClinicCap ?? 160));
  const [saving, setSaving] = useState<"dates" | "cap" | null>(null);
  const [message, setMessage] = useState<Feedback>(null);
  const validDates = parsedDates(dates);
  const dirtyDates =
    JSON.stringify(dates) !== JSON.stringify(datesFromClass(item));
  const capNumber = Number(cap);
  const validCap =
    cap.trim() !== "" &&
    Number.isSafeInteger(capNumber) &&
    capNumber >= 0 &&
    capNumber <= 2147483647;
  const save = async (kind: "dates" | "cap") => {
    if (saving || (kind === "dates" && !validDates)) return;
    setSaving(kind);
    setMessage(null);
    try {
      const updated =
        kind === "dates"
          ? await adminApi.updateClassDates(item.id, validDates!)
          : await adminApi.updateClassCap(item.id, capNumber);
      onSaved(updated);
      logMessage(`Updated class ${item.id}: ${kind}`);
      setMessage({
        kind: "success",
        text:
          kind === "dates"
            ? "תאריכי תחילת הדיווח נשמרו."
            : "מכסת הקליניקה הפרטית נשמרה.",
      });
    } catch (err) {
      logMessage(
        `Class update failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "השמירה נכשלה. השינויים נשמרו בטופס; פרטים ביומן הפעולות.",
      });
    } finally {
      setSaving(null);
    }
  };
  return (
    <details className="admin-class-card">
      <summary>
        <strong>{item.name}</strong>
        <small>
          תאריכי דיווח ומכסה <ChevronDown size={16} />
        </small>
      </summary>
      <AdminFeedback message={message} />
      <fieldset disabled={!!saving}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("dates");
          }}
        >
          <p className="description">
            אפשר לדווח החל מהתאריך שנקבע לכל סוג שעות, כולל יום זה. שינוי
            התאריכים חל על כל הסטודנטים במחזור; דיווחים קיימים אינם נמחקים.
          </p>
          <DateFields
            dates={dates}
            onChange={setDates}
            prefix={`class-${item.id}`}
          />
          <div className="admin-action-bar">
            <p>פורמט תאריך: יום / חודש / שנה</p>
            <button
              type="submit"
              disabled={!!saving || !validDates || !dirtyDates}
            >
              {saving === "dates" ? "שומרים…" : "שמירת תאריכי הדיווח"}
            </button>
          </div>
        </form>
        <form
          className="admin-cap-row"
          onSubmit={(e) => {
            e.preventDefault();
            void save("cap");
          }}
        >
          <label className="form-group" htmlFor={`cap-${item.id}`}>
            מכסת שעות קליניקה פרטית
            <input
              id={`cap-${item.id}`}
              type="number"
              min="0"
              max="2147483647"
              step="1"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="admin-secondary"
            disabled={
              !!saving ||
              !validCap ||
              capNumber === (item.privateClinicCap ?? 160)
            }
          >
            {saving === "cap" ? "שומרים…" : "שמירת המכסה"}
          </button>
        </form>
      </fieldset>
    </details>
  );
}
export function ClassManagementForm({
  logMessage,
}: {
  logMessage: (message: string) => void;
}) {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [dates, setDates] = useState<Dates>(blankDates);
  const [cap, setCap] = useState("160");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Feedback>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await adminApi.getClasses());
      setError(false);
    } catch (err) {
      setError(true);
      logMessage(
        `Error loading classes: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [logMessage]);
  useEffect(() => {
    void load();
  }, [load]);
  const parsed = parsedDates(dates);
  const validCap =
    cap.trim() !== "" &&
    Number.isSafeInteger(Number(cap)) &&
    Number(cap) >= 0 &&
    Number(cap) <= 2147483647;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed || !name.trim() || !validCap || busy) return;
    setBusy(true);
    try {
      const created = await adminApi.createClass({
        name: name.trim(),
        reportingStartDates: parsed,
        privateClinicCap: Number(cap),
      });
      setClasses((current) =>
        [...current, created].sort((a, b) =>
          a.name.localeCompare(b.name, "he"),
        ),
      );
      setName("");
      setDates(blankDates);
      setCap("160");
      setMessage({
        kind: "success",
        text: `המחזור ״${created.name}״ נוסף בהצלחה.`,
      });
      logMessage(`Created class ${created.id}.`);
    } catch (err) {
      logMessage(
        `Error creating class: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "יצירת המחזור נכשלה. בדקו אם קיים מחזור באותו שם; פרטים ביומן הפעולות.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>מחזורים קיימים</h2>
      <p className="description">
        פתחו מחזור כדי לערוך את תאריכי תחילת הדיווח ואת מכסת השעות בקליניקה
        פרטית.
      </p>
      {loading ? (
        <p className="admin-empty">טוענים מחזורים…</p>
      ) : error ? (
        <div className="admin-feedback admin-feedback--error">
          לא ניתן לטעון מחזורים.{" "}
          <button onClick={() => void load()} type="button">
            ניסיון נוסף
          </button>
        </div>
      ) : (
        <div className="admin-class-list">
          {classes.map((item) => (
            <ClassEditor
              key={item.id}
              item={item}
              logMessage={logMessage}
              onSaved={(updated) =>
                setClasses((current) =>
                  current.map((value) =>
                    value.id === updated.id ? updated : value,
                  ),
                )
              }
            />
          ))}
          {!classes.length && (
            <p className="admin-empty">עדיין לא נוצרו מחזורים.</p>
          )}
        </div>
      )}
      <hr className="section-divider" />
      <details>
        <summary className="admin-create-summary">
          <Plus size={18} />
          פתיחת מחזור חדש
        </summary>
        <AdminFeedback message={message} />
        <form className="admin-subsection" onSubmit={submit}>
          <fieldset disabled={busy}>
            <label className="form-group" htmlFor="new-class-name">
              שם המחזור
              <input
                id="new-class-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="למשל: מחזור נובמבר 2026"
              />
            </label>
            <p className="admin-info">
              יש לקבוע תאריך תחילת דיווח לכל אחד מסוגי השעות. התאריכים ניתנים
              לעריכה גם לאחר פתיחת המחזור.
            </p>
            <DateFields dates={dates} onChange={setDates} prefix="new-class" />
            <label
              className="form-group admin-subsection"
              htmlFor="new-class-cap"
            >
              מכסת שעות קליניקה פרטית
              <input
                id="new-class-cap"
                type="number"
                min="0"
                max="2147483647"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                required
              />
            </label>
            <div className="admin-action-bar">
              <span />
              <button
                type="submit"
                disabled={busy || !name.trim() || !parsed || !validCap}
              >
                {busy ? "יוצרים מחזור…" : "יצירת המחזור"}
              </button>
            </div>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
