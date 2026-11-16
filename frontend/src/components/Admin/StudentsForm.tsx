import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import type { AdminClass } from "../../types";
import { AdminFeedback, type Feedback } from "./AdminShared";

export function StudentsForm({
  logMessage,
}: {
  logMessage: (message: string) => void;
}) {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [mode, setMode] = useState<"single" | "csv">("single");
  const [file, setFile] = useState<File | null>(null);
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    taz: "",
  });
  const [message, setMessage] = useState<Feedback>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setClasses(await adminApi.getClasses());
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
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
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!classId || busy) return;
    let upload = file;
    if (mode === "single") {
      const csv = [
        "firstname,lastname,email,taz",
        [
          student.firstName.trim(),
          student.lastName.trim(),
          student.email.trim(),
          student.taz.trim(),
        ]
          .map((value) => `"${value.replace(/"/g, '""')}"`)
          .join(","),
      ].join("\r\n");
      upload = new File([csv], "single-student.csv", { type: "text/csv" });
    }
    if (!upload) return;
    if (
      !dryRun &&
      !window.confirm(
        `להוסיף את ${mode === "single" ? "הסטודנט" : "הסטודנטים מהקובץ"} למחזור ״${classes.find((item) => item.id === classId)?.name}״? הפעולה תעדכן את המערכת בפועל.`,
      )
    )
      return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await adminApi.importStudents(classId, upload, dryRun);
      logMessage(
        `Student import (dryRun=${dryRun}): ${JSON.stringify(result)}`,
      );
      const hasProblems =
        result.failed > 0 ||
        !!result.errors?.length ||
        !!result.parseWarnings?.length;
      setMessage({
        kind: hasProblems ? "error" : "success",
        text: dryRun
          ? `בדיקת הנתונים הסתיימה. לא בוצעו שינויים במערכת.${hasProblems ? " נמצאו בעיות; פרטים ביומן הפעולות." : " הנתונים תקינים. בטלו את הסימון ״בדיקה בלבד״ ושלחו שוב להוספה בפועל."}`
          : `נוספו ${result.created} סטודנטים. ${result.skipped} דולגו, ${result.failed} נכשלו.${hasProblems ? " פרטים ביומן הפעולות." : ""}`,
      });
      if (!dryRun && !hasProblems && mode === "single")
        setStudent({ firstName: "", lastName: "", email: "", taz: "" });
    } catch (err) {
      logMessage(
        `Student import failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "לא ניתן להשלים את הפעולה. בדקו ביומן הפעולות ובמערכת לפני ניסיון נוסף.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>הוספה למחזור לימודים</h2>
      <p className="description">
        בחרו מחזור, הזינו פרטים ובדקו אותם לפני ההוספה. אפשר להוסיף סטודנט יחיד
        או לייבא רשימה מקובץ.
      </p>
      <AdminFeedback message={message} />
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label className="form-group" htmlFor="student-class">
            מחזור לימודים
            <select
              id="student-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">
                {loading ? "טוענים מחזורים…" : "בחירת מחזור"}
              </option>
              {classes.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {loadError && (
            <div className="admin-feedback admin-feedback--error">
              טעינת המחזורים נכשלה.{" "}
              <button type="button" onClick={() => void load()}>
                ניסיון נוסף
              </button>
            </div>
          )}
          {!loading && !loadError && !classes.length && (
            <p className="form-error">
              יש ליצור מחזור בלשונית מחזורי לימוד לפני הוספת סטודנטים.
            </p>
          )}
          <nav className="admin-source-tabs" aria-label="אופן הוספת סטודנטים">
            <button
              type="button"
              aria-pressed={mode === "single"}
              onClick={() => {
                setMode("single");
                setMessage(null);
              }}
            >
              סטודנט יחיד
            </button>
            <button
              type="button"
              aria-pressed={mode === "csv"}
              onClick={() => {
                setMode("csv");
                setMessage(null);
              }}
            >
              ייבוא רשימה מקובץ
            </button>
          </nav>
          {mode === "single" ? (
            <div className="form-grid">
              <label className="form-group" htmlFor="student-first">
                שם פרטי
                <input
                  id="student-first"
                  value={student.firstName}
                  onChange={(e) =>
                    setStudent({ ...student, firstName: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-group" htmlFor="student-last">
                שם משפחה
                <input
                  id="student-last"
                  value={student.lastName}
                  onChange={(e) =>
                    setStudent({ ...student, lastName: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-group" htmlFor="student-email">
                כתובת דוא״ל
                <input
                  id="student-email"
                  type="email"
                  dir="ltr"
                  value={student.email}
                  onChange={(e) =>
                    setStudent({ ...student, email: e.target.value })
                  }
                  required
                />
              </label>
              <label className="form-group" htmlFor="student-taz">
                תעודת זהות
                <input
                  id="student-taz"
                  inputMode="numeric"
                  value={student.taz}
                  onChange={(e) =>
                    setStudent({ ...student, taz: e.target.value })
                  }
                  required
                />
              </label>
            </div>
          ) : (
            <>
              <div className="template-explainer">
                <strong>הכנת קובץ הסטודנטים</strong>
                <p>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1DQXTOjh7o9U10ooJbIiaI1z3ZNRBBXyuglH2d3Sc3Go/edit?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    פתיחת תבנית Google Sheets לדוגמה ↗
                  </a>
                </p>
                <ol>
                  <li>
                    צרו עותק של התבנית ומלאו את פרטי הסטודנטים לפי העמודות.
                  </li>
                  <li>בחרו קובץ ← הורדה ← ערכים מופרדים בפסיקים (CSV).</li>
                  <li>בחרו כאן את הקובץ שהורדתם.</li>
                </ol>
              </div>
              <label className="admin-file-picker">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <span>בחירת קובץ סטודנטים</span>
                <small>{file?.name || "קובץ CSV לפי התבנית"}</small>
              </label>
            </>
          )}
          <label className="admin-check-label admin-subsection">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            <span>
              <strong>בדיקה בלבד, ללא הוספה למערכת</strong>
              <br />
              מומלץ לבדוק תחילה שהנתונים תקינים. לאחר הבדיקה בטלו את הסימון כדי
              לבצע את ההוספה.
            </span>
          </label>
          <div className="admin-action-bar">
            <p>
              {dryRun
                ? "הפעולה הבאה תבדוק נתונים בלבד"
                : "הפעולה הבאה תוסיף סטודנטים למערכת"}
            </p>
            <button
              type="submit"
              disabled={
                busy ||
                loading ||
                loadError ||
                !classId ||
                (mode === "csv" && !file)
              }
            >
              {busy
                ? "מעבדים את הנתונים…"
                : dryRun
                  ? "בדיקת הנתונים"
                  : mode === "single"
                    ? "הוספת הסטודנט"
                    : "ייבוא הסטודנטים"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
