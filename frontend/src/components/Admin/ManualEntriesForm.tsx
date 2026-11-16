import {
  identifierRows,
  isIdentifierHeader,
  normalizeIdentifier,
  useAdminStudents,
} from "./adminStudents";
import { useMemo, useState } from "react";
import * as adminApi from "../../api/adminApi";
import type { ManualEntryPayload } from "../../types";
import {
  AdminFeedback,
  CsvInput,
  SourceTabs,
  StudentPicker,
  type Feedback,
} from "./AdminShared";

export function ManualEntriesForm({
  logMessage,
}: {
  logMessage: (message: string) => void;
}) {
  const { students, loading, error, reload } = useAdminStudents(logMessage);
  const [source, setSource] = useState<"list" | "csv">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hours, setHours] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("mentor");
  const [commonHours, setCommonHours] = useState("10");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Feedback>(null);
  const [deleteIds, setDeleteIds] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<Feedback>(null);
  const csv = useMemo(() => {
    const errors: string[] = [];
    const rows = new Map<
      string,
      { userId: string; hours: number; name: string }
    >();
    identifierRows(csvText).forEach((row, index) => {
      if (index === 0 && isIdentifierHeader(row[0])) return;
      const student = students.find(
        (student) =>
          normalizeIdentifier(student.taz || "") ===
          normalizeIdentifier(row[0]),
      );
      const value = Number(row[1]);
      if (
        row.length !== 2 ||
        !row[1]?.trim() ||
        !Number.isSafeInteger(value) ||
        value === 0
      )
        errors.push(
          `שורה ${index + 1}: יש להזין תעודת זהות ושעות שלמות שאינן אפס.`,
        );
      else if (!student)
        errors.push(
          `שורה ${index + 1}: תעודת הזהות ${row[0]} לא נמצאה ברשימה.`,
        );
      else if (rows.has(student.id))
        errors.push(`שורה ${index + 1}: הסטודנט כבר מופיע בקובץ.`);
      else
        rows.set(student.id, {
          userId: student.id,
          hours: value,
          name: `${student.firstName} ${student.lastName}`,
        });
    });
    return { rows: [...rows.values()], errors };
  }, [csvText, students]);
  const targets =
    source === "csv"
      ? csv.rows
      : students
          .filter((student) => selected.has(student.id))
          .map((student) => ({
            userId: student.id,
            hours: Number(hours[student.id] ?? "10"),
            name: `${student.firstName} ${student.lastName}`,
          }));
  const invalid = targets.some(
    (target) => !Number.isSafeInteger(target.hours) || target.hours === 0,
  );
  const totalHours = targets.reduce((total, target) => total + target.hours, 0);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !targets.length ||
      invalid ||
      (source === "csv" && csv.errors.length) ||
      busy
    )
      return;
    if (
      !window.confirm(
        `להוסיף ${totalHours} שעות בסך הכול ל־${targets.length} סטודנטים עבור ״${title.trim()}״?`,
      )
    )
      return;
    setBusy(true);
    setMessage(null);
    const payload: ManualEntryPayload[] = targets.map(({ userId, hours }) => ({
      userId,
      hours,
      cause: title.trim(),
      type,
    }));
    try {
      const result = await adminApi.bulkAddManualEntries(payload);
      logMessage(`Manual hours result: ${JSON.stringify(result)}`);
      setMessage({
        kind: result.failedCount ? "error" : "success",
        text: `נוספו שעות ל־${result.createdCount} סטודנטים.${result.failedCount ? ` ${result.failedCount} רשומות נכשלו. פרטים ביומן הפעולות; כדי למנוע כפילות יש לנסות שוב רק עבורן.` : ""}${result.batchId ? ` מזהה הפעולה: ${result.batchId}` : ""}`,
      });
      // Clear recipients even on partial success so retry cannot duplicate successful rows.
      setSelected(new Set());
      setCsvText("");
      if (!result.failedCount) {
        setTitle("");
        setHours({});
      }
    } catch (err) {
      logMessage(
        `Error adding manual hours: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "לא ניתן לאשר את תוצאת הפעולה. בדקו בדוחות וביומן לפני ניסיון נוסף כדי למנוע הזנה כפולה.",
      });
    } finally {
      setBusy(false);
    }
  };
  const remove = async (event: React.FormEvent) => {
    event.preventDefault();
    const ids = [
      ...new Set(
        deleteIds
          .trim()
          .split(/[\s,;]+/)
          .filter(Boolean),
      ),
    ];
    if (
      ids.some((id) => !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id))
    ) {
      setDeleteMessage({
        kind: "error",
        text: "יש להזין מזהי רשומות או פעולות תקינים (UUID).",
      });
      return;
    }
    if (
      !ids.length ||
      !window.confirm(
        `למחוק לצמיתות את ${ids.length} הרשומות או הפעולות? כל השעות המשויכות לפעולה יימחקו. לא ניתן לבטל זאת.`,
      )
    )
      return;
    setDeleting(true);
    try {
      const result = await adminApi.deleteManualEntries(ids);
      logMessage(`Manual hours deletion: ${JSON.stringify(result)}`);
      setDeleteMessage({
        kind: "success",
        text: `נמחקו ${result.entriesDeleted} רשומות ו־${result.batchesDeleted} פעולות.`,
      });
      setDeleteIds("");
    } catch (err) {
      logMessage(
        `Deletion error: ${err instanceof Error ? err.message : String(err)}`,
      );
      setDeleteMessage({
        kind: "error",
        text: "המחיקה נכשלה. פרטים ביומן הפעולות.",
      });
    } finally {
      setDeleting(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>הוספת שעות מנהלתיות</h2>
      <p className="description">
        הזנת שעות שאינן מדווחות בלוח השנה, למשל הדרכה קבוצתית. בחרו סטודנטים
        מהרשימה או ייבאו קובץ, הגדירו שעות לכל סטודנט ואשרו את הפעולה.
      </p>
      <AdminFeedback message={message} />
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="form-grid">
            <label className="form-group" htmlFor="manual-title">
              שם הקבוצה או סיבת ההזנה
              <input
                id="manual-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="למשל: הדרכה קבוצתית, מחזור נובמבר"
              />
            </label>
            <label className="form-group" htmlFor="manual-type">
              סוג השעות
              <select
                id="manual-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="mentor">הדרכה</option>
                <option value="client">טיפול במטופלים</option>
                <option value="therapist">טיפול אישי</option>
              </select>
            </label>
          </div>
          <SourceTabs value={source} onChange={setSource} />
          {loading ? (
            <p className="admin-empty">טוענים סטודנטים…</p>
          ) : error ? (
            <div className="admin-feedback admin-feedback--error">
              טעינת הרשימה נכשלה.{" "}
              <button type="button" onClick={() => void reload()}>
                ניסיון נוסף
              </button>
            </div>
          ) : source === "list" ? (
            <>
              <StudentPicker
                students={students}
                selected={selected}
                onChange={setSelected}
                hours={hours}
                onHoursChange={(id, value) =>
                  setHours((current) => ({ ...current, [id]: value }))
                }
              />
              <div className="admin-cap-row">
                <label className="form-group" htmlFor="common-hours">
                  שעות אחידות לנבחרים
                  <input
                    id="common-hours"
                    type="number"
                    step="1"
                    value={commonHours}
                    onChange={(e) => setCommonHours(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={
                    !selected.size ||
                    !Number.isSafeInteger(Number(commonHours)) ||
                    Number(commonHours) === 0
                  }
                  onClick={() =>
                    setHours((current) => ({
                      ...current,
                      ...Object.fromEntries(
                        [...selected].map((id) => [id, commonHours]),
                      ),
                    }))
                  }
                >
                  החלה על {selected.size} נבחרים
                </button>
              </div>
            </>
          ) : (
            <>
              <CsvInput
                id="manual-csv"
                value={csvText}
                onChange={setCsvText}
                description="שתי עמודות: תעודת זהות, מספר שעות. לדוגמה: 123456789,8. אפשר לכלול כותרת. הנתונים בלשונית זו בלבד יישלחו."
              />
              {csv.errors.length > 0 && (
                <div
                  className="admin-feedback admin-feedback--error"
                  role="alert"
                >
                  {csv.errors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
              {csv.rows.length > 0 && (
                <div className="admin-preview">
                  <strong>{csv.rows.length} סטודנטים זוהו</strong>
                  <ul>
                    {csv.rows.map((row) => (
                      <li key={row.userId}>
                        {row.name} · {row.hours} שעות
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {invalid && (
            <p className="form-error" role="alert">
              יש להזין לכל סטודנט מספר שעות שלם שאינו אפס. לתיקון אפשר להזין
              מספר שלילי.
            </p>
          )}
          <div className="admin-action-bar">
            <p>
              <strong>{targets.length}</strong> סטודנטים ·{" "}
              <strong>{Number.isFinite(totalHours) ? totalHours : 0}</strong>{" "}
              שעות בסך הכול
            </p>
            <button
              type="submit"
              disabled={
                busy ||
                loading ||
                error ||
                !title.trim() ||
                !targets.length ||
                invalid ||
                (source === "csv" && csv.errors.length > 0)
              }
            >
              {busy ? "מוסיפים שעות…" : "אישור והוספת השעות"}
            </button>
          </div>
        </fieldset>
      </form>
      <details className="admin-subsection">
        <summary>מחיקת שעות מנהלתיות או ביטול פעולה</summary>
        <p className="description">
          הזינו מזהי רשומות או את מזהה הפעולה שהתקבל בעת ההוספה. מחיקת פעולה
          מסירה את כל השעות שנוספו בה.
        </p>
        <AdminFeedback message={deleteMessage} />
        <form onSubmit={remove}>
          <label className="form-group" htmlFor="delete-manual">
            מזהי רשומות או פעולות, אחד בכל שורה
            <textarea
              id="delete-manual"
              className="uuids-input"
              dir="ltr"
              required
              value={deleteIds}
              onChange={(e) => setDeleteIds(e.target.value)}
              disabled={deleting}
            />
          </label>
          <div>
            <button
              className="button-danger"
              type="submit"
              disabled={deleting || !deleteIds.trim()}
            >
              {deleting ? "מוחקים…" : "מחיקת השעות לצמיתות"}
            </button>
          </div>
        </form>
      </details>
    </section>
  );
}
