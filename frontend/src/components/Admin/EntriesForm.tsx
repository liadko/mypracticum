import { useState } from "react";
import * as adminApi from "../../api/adminApi";
import { AdminFeedback, type Feedback } from "./AdminShared";

function EntryAction({
  deletion,
  logMessage,
}: {
  deletion?: boolean;
  logMessage: (message: string) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Feedback>(null);
  const ids = [
    ...new Set(
      text
        .trim()
        .split(/[\s,;]+/)
        .filter(Boolean),
    ),
  ];
  const valid =
    ids.length > 0 &&
    ids.every((id) => /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || busy) return;
    if (
      deletion &&
      !window.confirm(
        `למחוק לצמיתות ${ids.length} דיווחים? לא ניתן לבטל את הפעולה.`,
      )
    )
      return;
    setBusy(true);
    setMessage(null);
    try {
      if (deletion) {
        const result = await adminApi.deleteEntries(ids);
        logMessage(`Entry deletion: ${JSON.stringify(result)}`);
        setMessage({
          kind: "success",
          text: `נמחקו ${result.deleted} דיווחים.`,
        });
        setText("");
      } else {
        const result = await adminApi.approveEntries(ids);
        logMessage(`Entry approval: ${JSON.stringify(result)}`);
        const failed =
          (result.notFound?.length || 0) + (result.errors?.length || 0);
        setMessage({
          kind: failed ? "error" : "success",
          text: `אושרו ${result.succeeded} מתוך ${result.total} דיווחים.${failed ? " חלק מהדיווחים לא אושרו. פרטים ביומן הפעולות." : ""}`,
        });
        setText(
          [
            ...(result.notFound || []),
            ...(result.errors || []).map((row) => row.id),
          ].join("\n"),
        );
      }
    } catch (err) {
      logMessage(
        `Entry action error: ${err instanceof Error ? err.message : String(err)}`,
      );
      setMessage({
        kind: "error",
        text: "הפעולה לא הושלמה. פרטים ביומן הפעולות.",
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit}>
      <AdminFeedback message={message} />
      <label
        className="form-group"
        htmlFor={deletion ? "delete-entry-ids" : "approve-entry-ids"}
      >
        מזהי הדיווחים, אחד בכל שורה
        <textarea
          id={deletion ? "delete-entry-ids" : "approve-entry-ids"}
          className="uuids-input"
          dir="ltr"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          required
        />
      </label>
      {text.trim() && !valid && (
        <p className="form-error">יש להזין מזהי דיווח תקינים (UUID).</p>
      )}
      <div className="admin-action-bar">
        <p>{ids.length} דיווחים ברשימה</p>
        <button
          type="submit"
          className={deletion ? "button-danger" : undefined}
          disabled={busy || !valid}
        >
          {busy
            ? "מבצעים…"
            : deletion
              ? "מחיקת הדיווחים לצמיתות"
              : "אישור הדיווחים"}
        </button>
      </div>
    </form>
  );
}
export function EntriesForm({
  logMessage,
}: {
  logMessage: (message: string) => void;
}) {
  return (
    <section className="admin-card">
      <h2>אישור דיווחי שעות</h2>
      <p className="description">
        הדביקו את מזהי הדיווחים לאישור. אפשר להפריד בשורות, ברווחים או בפסיקים.
        הפעולה מתייחסת לדיווחים שהסטודנטים הוסיפו בלוח השנה.
      </p>
      <EntryAction logMessage={logMessage} />
      <details className="admin-subsection">
        <summary>מחיקת דיווחים</summary>
        <p className="description">
          מחיקה מסירה את השעות מהמערכת לצמיתות. עבור שעות מנהלתיות, השתמשו בכלי
          המחיקה בלשונית שעות מנהלתיות.
        </p>
        <EntryAction deletion logMessage={logMessage} />
      </details>
    </section>
  );
}
