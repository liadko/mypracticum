import { useState } from 'react';
import * as adminApi from '../../api/adminApi';

interface Props {
    logMessage: (message: string) => void;
}

export function StudentsForm({ logMessage }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [dryRun, setDryRun] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            logMessage('Error: No file selected.');
            return;
        }

        if (!dryRun) {
            const confirmMsg =
                'This is a LIVE import and will create students in the database.\n\nAre you sure you want to continue?';
            if (!window.confirm(confirmMsg)) {
                logMessage('Import canceled by user.');
                return;
            }
        }

        setIsLoading(true);
        logMessage(`Uploading file... (Dry Run: ${dryRun})`);

        try {
            console.log('Uploading file:', file, 'Dry Run:', dryRun);
            const result = await adminApi.importStudents(file, dryRun);
            logMessage('SUCCESS: Import complete.');
            logMessage(JSON.stringify(result, null, 2));

            // Check for warnings/failures
            const errors = result.errors || [];
            const warnings = result.parseWarnings || [];
            if (
                dryRun &&
                result.failures === 0 &&
                errors.length === 0 &&
                warnings.length === 0
            ) {
                window.alert(
                    'בדיקת ההוספה הסתיימה בהצלחה!\n\nלא נמצאו שגיאות. אפשר להוריד את הסימון ולהעלות בבטחה.',
                );
            } else if (dryRun) {
                window.alert('נמצאו בעיות במהלך בדיקת ההוספה. בדוק את יומן ההודעות.');
            }
        } catch (err: unknown) {
            window.alert('נמצאו בעיות במהלך בדיקת ההוספה. בדוק את יומן ההודעות.');
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="admin-card admin-page active" id="page-import-students">
            <h2>Import Students (CSV)</h2>
            <form onSubmit={handleSubmit}>
                <div className="template-explainer">
                    <p>
                        <strong>צריכים עזרה עם הפורמט?</strong>
                        <a href="https://docs.google.com/spreadsheets/d/1DQXTOjh7o9U10ooJbIiaI1z3ZNRBBXyuglH2d3Sc3Go/edit?usp=sharing" target="_blank">לחצו כאן לתבנית גוגל שיטס לדוגמה</a>
                    </p>
                    <ol>
                        <li>בגוגל שיטס, לחצו על <strong>'קובץ' (File) {'>'} 'יצירת עותק' (Make a copy)</strong>.</li>
                        <li>מלאו את פרטי הסטודנטים בעותק שיצרתם (בדיוק לפי העמודות).</li>
                        <li>בסיום, לחצו על <strong>'קובץ' (File) {'>'} 'הורדה' (Download)</strong> ובחרו <strong>'ערכים מופרדים בפסיקים (.csv)'</strong>.</li>
                        <li>את הקובץ שירד למחשב, צרפו כאן למטה.</li>
                    </ol>
                </div>
                <div className="form-group">
                    <label htmlFor="file-input">Select CSV File:</label>
                    <input
                        type="file"
                        id="file-input"
                        accept=".csv"
                        required
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>
                <div className="dryrun-form-group">
                    <input
                        type="checkbox"
                        id="dry-run-check"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                    />
                    <label htmlFor="dry-run-check">
                        Test Run (RECOMMENDED! it tests the csv without actually adding
                        anyone)
                    </label>
                </div>
                <button type="submit" disabled={isLoading || !file}>
                    {isLoading ? 'Processing...' : 'Upload and Process'}
                </button>
            </form>
        </section>
    );
}