import { useEffect, useState } from 'react';
import * as adminApi from '../../api/adminApi';
import type { AdminClass, StudentImportResponse } from '../../types';

interface Props {
    logMessage: (message: string) => void;
}

export function StudentsForm({ logMessage }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [classId, setClassId] = useState('');
    const [classes, setClasses] = useState<AdminClass[]>([]);
    const [dryRun, setDryRun] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [singleStudent, setSingleStudent] = useState({ firstName: '', lastName: '', email: '', taz: '' });

    useEffect(() => {
        const loadClasses = async () => {
            try {
                setClasses(await adminApi.getClasses());
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error while loading classes';
                logMessage(`Error loading classes: ${message}`);
            } finally {
                setIsLoadingClasses(false);
            }
        };
        void loadClasses();
    }, [logMessage]);

    const reportResult = (result: StudentImportResponse, description: string) => {
        logMessage(`SUCCESS: ${description}. Created: ${result.created}; failed: ${result.failed}; skipped: ${result.skipped}.`);
        const errors = result.errors || [];
        const warnings = result.parseWarnings || [];
        if (errors.length > 0 || warnings.length > 0) {
            logMessage(JSON.stringify(result, null, 2));
        }
        if (dryRun && result.failed === 0 && errors.length === 0 && warnings.length === 0) {
            window.alert('בדיקת ההוספה הסתיימה בהצלחה!\n\nלא נמצאו שגיאות. אפשר להוריד את הסימון ולהעלות בבטחה.');
        } else if (dryRun) {
            window.alert('נמצאו בעיות במהלך בדיקת ההוספה. בדוק את יומן ההודעות.');
        }
    };

    const importStudents = async (studentFile: File, description: string): Promise<boolean> => {
        if (!classId) {
            logMessage('Error: Select a class before adding students.');
            return false;
        }

        if (!dryRun) {
            const confirmMsg = 'This is a LIVE import and will create students in the database.\n\nAre you sure you want to continue?';
            if (!window.confirm(confirmMsg)) {
                logMessage('Import canceled by user.');
                return false;
            }
        }

        setIsLoading(true);
        logMessage(`${description}... (Dry Run: ${dryRun})`);
        try {
            const result = await adminApi.importStudents(classId, studentFile, dryRun);
            reportResult(result, description);
            return true;
        } catch (err: unknown) {
            window.alert('נמצאו בעיות במהלך בדיקת ההוספה. בדוק את יומן ההודעות.');
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            logMessage('Error: No file selected.');
            return;
        }
        await importStudents(file, 'CSV import');
    };

    const handleSingleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const csv = [
            'firstname,lastname,email,taz',
            [singleStudent.firstName, singleStudent.lastName, singleStudent.email, singleStudent.taz]
                .map((value) => `"${value.replace(/"/g, '""')}"`)
                .join(','),
        ].join('\r\n');
        const imported = await importStudents(new File([csv], 'single-student.csv', { type: 'text/csv' }), 'Single student import');
        if (imported) {
            setSingleStudent({ firstName: '', lastName: '', email: '', taz: '' });
        }
    };

    return (
        <section className="admin-card admin-page active" id="page-import-students">
            <h2>Add Students</h2>
            <div className="form-group">
                <label htmlFor="student-class">Class:</label>
                <select
                    id="student-class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    disabled={isLoadingClasses || isLoading}
                >
                    <option value="">Select a class</option>
                    {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                    ))}
                </select>
                {!isLoadingClasses && classes.length === 0 && <p className="form-error">Create a class before adding students.</p>}
            </div>
            <div className="dryrun-form-group">
                <input
                    type="checkbox"
                    id="dry-run-check"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    disabled={isLoading}
                />
                <label htmlFor="dry-run-check">Test Run (RECOMMENDED! it tests the data without actually adding anyone)</label>
            </div>

            <form onSubmit={handleSingleStudentSubmit}>
                <h3>Add One Student</h3>
                <div className="form-group">
                    <label htmlFor="single-first-name">First name:</label>
                    <input id="single-first-name" value={singleStudent.firstName} onChange={(e) => setSingleStudent((current) => ({ ...current, firstName: e.target.value }))} required />
                </div>
                <div className="form-group">
                    <label htmlFor="single-last-name">Last name:</label>
                    <input id="single-last-name" value={singleStudent.lastName} onChange={(e) => setSingleStudent((current) => ({ ...current, lastName: e.target.value }))} required />
                </div>
                <div className="form-group">
                    <label htmlFor="single-email">Email:</label>
                    <input id="single-email" type="email" value={singleStudent.email} onChange={(e) => setSingleStudent((current) => ({ ...current, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                    <label htmlFor="single-taz">TAZ:</label>
                    <input id="single-taz" value={singleStudent.taz} onChange={(e) => setSingleStudent((current) => ({ ...current, taz: e.target.value }))} required />
                </div>
                <button type="submit" disabled={isLoading || isLoadingClasses || !classId}>
                    {isLoading ? 'Processing...' : 'Add Student'}
                </button>
            </form>

            <hr className="section-divider" />
            <form onSubmit={handleSubmit}>
                <h3>Import Students (CSV)</h3>
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
                <button type="submit" disabled={isLoading || isLoadingClasses || !file || !classId}>
                    {isLoading ? 'Processing...' : 'Upload and Process'}
                </button>
            </form>
        </section>
    );
}
