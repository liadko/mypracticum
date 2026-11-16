import {
  identifierRows,
  isIdentifierHeader,
  normalizeIdentifier,
  useAdminStudents,
} from "./adminStudents";
import { useMemo, useState } from "react";
import * as adminApi from "../../api/adminApi";
import type { FreezeReason } from "../../types";
import {
  AdminFeedback,
  CsvInput,
  SourceTabs,
  StudentPicker,
  type Feedback,
} from "./AdminShared";

const reasons: { value: FreezeReason; label: string }[] = [
  { value: "on_leave", label: "בחופשה" },
  { value: "left_program", label: "עזב/ה את התוכנית" },
  { value: "finished", label: "סיים/ה את התוכנית" },
  { value: "other", label: "אחר" },
];
export function FreezeStudentsForm({
  logMessage,
}: {
  logMessage: (message: string) => void;
}) {
  const { students, loading, error, reload } = useAdminStudents(logMessage);
  const [source, setSource] = useState<"list" | "csv">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [csvText, setCsvText] = useState("");
  const [reason, setReason] = useState<FreezeReason>("on_leave");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Feedback>(null);
  const csvIdentifiers = useMemo(
    () =>
      Array.from(
        new Set(
          identifierRows(csvText)
            .map((row) => row[0])
            .filter(
              (value, index) =>
                value && !(index === 0 && isIdentifierHeader(value)),
            )
            .map(normalizeIdentifier),
        ),
      ),
    [csvText],
  );
  const identifiers = source === "list" ? [...selected] : csvIdentifiers;
  const matched = csvIdentifiers.map((identifier) => ({
    identifier,
    student: students.find((student) =>
      [student.id, student.taz, student.email].some(
        (value) => normalizeIdentifier(value || "") === identifier,
      ),
    ),
  }));
  const submit = async (status: "frozen" | "active") => {
    if (!identifiers.length || busy) return;
    const action =
      status === "frozen" ? "להקפיא את החשבונות של" : "להחזיר לפעילות את";
    if (
      !window.confirm(`האם ${action} ${identifiers.length} הסטודנטים שבחרתם?`)
    )
      return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await adminApi.setStudentStatus({
        identifiers,
        status,
        ...(status === "frozen" && { reason, note }),
      });
      logMessage(`Student status result: ${JSON.stringify(result)}`);
      const missing =
        (result.notFound?.length || 0) + (result.failed?.length || 0);
      setMessage({
        kind: missing ? "error" : "success",
        text: `עודכנו ${result.updated} מתוך ${result.total} חשבונות.${missing ? " חלק מהחשבונות לא עודכנו. פרטים ביומן הפעולות." : ""}`,
      });
      setSelected(new Set());
      setCsvText("");
      setNote("");
      await reload();
    } catch (err) {
      logMessage(
        `Error changing student status: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "עדכון החשבונות נכשל. הבחירה נשמרה; פרטים ביומן הפעולות.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>בחירת חשבונות לעדכון</h2>
      <p className="description">
        חשבון בהקפאה יכול לצפות בנתונים, אך אינו יכול לשנות דיווחים. גם אישור
        השעות בידי המדריכים נעצר. ההקפאה אינה מוחקת נתונים.
      </p>
      <AdminFeedback message={message} />
      {loading ? (
        <p className="admin-empty">טוענים את רשימת הסטודנטים…</p>
      ) : error ? (
        <div className="admin-feedback admin-feedback--error">
          לא ניתן לטעון את הרשימה.{" "}
          <button type="button" onClick={() => void reload()}>
            ניסיון נוסף
          </button>
        </div>
      ) : (
        <fieldset disabled={busy}>
          <SourceTabs value={source} onChange={setSource} />
          {source === "list" ? (
            <StudentPicker
              students={students}
              selected={selected}
              onChange={setSelected}
            />
          ) : (
            <>
              <CsvInput
                id="freeze-csv"
                value={csvText}
                onChange={setCsvText}
                description="תעודת זהות או כתובת דוא״ל בעמודה הראשונה, סטודנט אחד בכל שורה. אפשר לכלול שורת כותרת. רק הנתונים בלשונית זו יישלחו."
              />
              {matched.length > 0 && (
                <div className="admin-preview">
                  <strong>{matched.length} חשבונות לעדכון</strong>
                  <ul>
                    {matched.map(({ identifier, student }) => (
                      <li key={identifier}>
                        {student
                          ? `${student.firstName} ${student.lastName}`
                          : "לא נמצא ברשימה"}{" "}
                        · <bdi>{identifier}</bdi>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="form-grid admin-subsection">
            <label className="form-group" htmlFor="freeze-reason">
              סיבת ההקפאה
              <select
                id="freeze-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as FreezeReason)}
              >
                {reasons.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group" htmlFor="freeze-note">
              הערה פנימית (לא חובה)
              <input
                id="freeze-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          <div className="admin-action-bar">
            <p>
              <strong>{identifiers.length}</strong> חשבונות נבחרו{" "}
              {source === "csv" ? "מהקובץ או מההדבקה" : "מהרשימה"}
            </p>
            <div className="admin-action-buttons">
              <button
                type="button"
                className="admin-secondary"
                disabled={!identifiers.length || busy}
                onClick={() => void submit("active")}
              >
                החזרה לפעילות
              </button>
              <button
                type="button"
                className="button-danger"
                disabled={!identifiers.length || busy}
                onClick={() => void submit("frozen")}
              >
                {busy ? "מעדכנים…" : "הקפאת החשבונות שנבחרו"}
              </button>
            </div>
          </div>
        </fieldset>
      )}
    </section>
  );
}
