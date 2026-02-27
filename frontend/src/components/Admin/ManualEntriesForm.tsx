import { useState, useEffect } from 'react';
import * as adminApi from '../../api/adminApi';
import type { StudentResponse, ManualEntryPayload } from '../../types';

// Define the state for each student in the list
type StudentSelection = StudentResponse & {
    isSelected: boolean;
    hoursAssigned: number;
};

interface Props {
    logMessage: (message: string) => void;
}

export function ManualEntriesForm({ logMessage }: Props) {
    // State for the whole component
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [allStudents, setAllStudents] = useState<StudentSelection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the "Add" form
    const [title, setTitle] = useState('');
    const [type, setType] = useState('mentor');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for the "Delete" form
    const [deleteIds, setDeleteIds] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const loadStudents = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const students = await adminApi.getStudents();

                setAllStudents(
                    students.map((s) => ({
                        ...s,
                        isSelected: false,
                        hoursAssigned: 10,
                    })),
                );
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred while loading students';
                setError(errorMsg);
                logMessage(`Error loading students: ${errorMsg}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadStudents();
    }, [logMessage]);

    // --- Student List Management ---
    const toggleStudent = (studentId: string) => {
        setAllStudents((currentStudents) =>
            currentStudents.map((s) =>
                s.id === studentId ? { ...s, isSelected: !s.isSelected } : s,
            ),
        );
    };

    const setStudentHours = (studentId: string, hours: number) => {
        setAllStudents((currentStudents) =>
            currentStudents.map((s) =>
                s.id === studentId ? { ...s, hoursAssigned: hours } : s,
            ),
        );
    };

    const filteredStudents = allStudents
        .filter((student) => {
            if (!searchTerm) return true; // Show all if no search
            const lowerSearch = searchTerm.toLowerCase();
            const name = `${student.firstName} ${student.lastName}`.toLowerCase();
            return (
                name.includes(lowerSearch) ||
                student.email.toLowerCase().includes(lowerSearch) ||
                student.taz.includes(lowerSearch)
            );
        })
        .sort((a, b) => {
            // Show selected students first, then sort by name
            if (a.isSelected && !b.isSelected) return -1;
            if (!a.isSelected && b.isSelected) return 1;
            return a.firstName.localeCompare(b.firstName);
        });

    // --- Form Handlers ---
    const handleCsvImport = () => {
        if (!csvFile) {
            logMessage('Error: No CSV file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            // Split by line, handle both \n and \r\n, ignore empty lines
            const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
            const updates = new Map<string, number>();
            let hasErrors = false;

            lines.forEach((line, index) => {
                const cols = line.split(',');
                if (cols.length != 2) {
                    logMessage(`CSV Error (Line ${index + 1}): Expected 2 columns, got ${cols.length}. Line content: "${line}"`);
                    hasErrors = true;
                    return;
                }

                const taz = cols[0].trim();
                const hoursRaw = cols[1].trim();
                const hours = parseFloat(hoursRaw);

                if (isNaN(hours)) {
                    logMessage(`CSV Error (Line ${index + 1}): Invalid hours '${hoursRaw}' for TAZ ${taz}`);
                    hasErrors = true;
                    return;
                }

                const studentExists = allStudents.some((s) => s.taz === taz);
                if (!studentExists) {
                    logMessage(`CSV Error (Line ${index + 1}): Student with TAZ ${taz} not found in the system.`);
                    hasErrors = true;
                    return;
                }

                updates.set(taz, hours);
            });

            if (hasErrors) {
                logMessage('CSV Import aborted due to errors. No students were selected.');
                return;
            }

            // Apply updates to the list
            setAllStudents((current) =>
                current.map((s) => {
                    if (updates.has(s.taz)) {
                        return { ...s, isSelected: true, hoursAssigned: updates.get(s.taz)! };
                    }
                    // Unselect anyone not in the CSV, don't touch hours
                    return { ...s, isSelected: false };
                })
            );

            logMessage(`SUCCESS: Selected ${updates.size} students from CSV and assigned hours.`);
            setCsvFile(null); // Reset file selection
        };

        reader.onerror = () => {
            logMessage('Error reading the CSV file.');
        };

        reader.readAsText(csvFile);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            logMessage('Error: Please provide a Group Title.');
            return;
        }

        const selectedStudents = allStudents.filter((s) => s.isSelected);
        if (selectedStudents.length === 0) {
            logMessage('Error: No students selected.');
            return;
        }

        const payload: ManualEntryPayload[] = selectedStudents.map((s) => ({
            userId: s.id,
            hours: s.hoursAssigned,
            cause: title,
            type: type,
        }));

        const confirmMsg = `Are you sure you want to add ${payload.length} manual entries?`;
        if (!window.confirm(confirmMsg)) {
            logMessage('Canceled by user.');
            return;
        }

        setIsSubmitting(true);
        logMessage(`Adding ${payload.length} manual entries...`);
        try {
            const result = await adminApi.bulkAddManualEntries(payload);
            logMessage('SUCCESS: Bulk add complete.');
            logMessage(JSON.stringify(result, null, 2));
            // Reset form
            setTitle('');
            setAllStudents((prev) =>
                prev.map((s) => ({ ...s, isSelected: false, hoursAssigned: 10 })),
            );
        } catch (err: unknown) {
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const raw = deleteIds.trim();
        if (!raw) {
            logMessage('Error: No IDs provided for deletion.');
            return;
        }

        const idList = Array.from(
            new Set(raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)),
        );

        const confirmMsg = `Are you sure you want to permanently delete ${idList.length} entries/batches?`;
        if (!window.confirm(confirmMsg)) {
            logMessage('Deletion canceled by user.');
            return;
        }

        setIsDeleting(true);
        logMessage(`Deleting ${idList.length} items...`);
        try {
            const result = await adminApi.deleteManualEntries(idList);
            logMessage('SUCCESS: Deletion complete.');
            logMessage(JSON.stringify(result, null, 2));
            setDeleteIds(''); // Clear form
        } catch (err: unknown) {
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Render ---
    return (
        <section className="admin-card admin-page active" id="page-manual-entries">
            <h2>Bulk Add Manual Hours (by Group)</h2>
            <form onSubmit={handleAddSubmit}>
                <div className="form-group">
                    <label htmlFor="group-title-input">Group Title (used as "Cause")</label>
                    <input
                        type="text"
                        id="group-title-input"
                        placeholder="הדרכה קבוצתית סיון קורן 2026"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="group-type-select">סוג שעות (Type)</label>
                    <select
                        id="group-type-select"
                        required
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="mentor">הדרכה (mentor)</option>
                        <option value="client">מטופלים שלי (client)</option>
                        <option value="therapist">טיפול אישי (therapist)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="student-search-input">Select Students</label>
                    <input
                        type="search"
                        id="student-search-input"
                        placeholder="חפש תלמיד לפי שם או אימייל..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div id="student-list-container" className="student-list-container">
                    {isLoading && <p className="loading-text">Loading students...</p>}
                    {error && <p className="loading-text">{error}</p>}
                    {!isLoading &&
                        !error &&
                        filteredStudents.map((student) => (
                            <div key={student.id} className="student-list-item">
                                <input
                                    type="checkbox"
                                    className="student-select-check"
                                    id={`student-${student.id}`}
                                    checked={student.isSelected}
                                    onChange={() => toggleStudent(student.id)}
                                />
                                <div className="student-info">
                                    <label
                                        htmlFor={`student-${student.id}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="name">
                                            {student.firstName} {student.lastName}
                                        </div>
                                        <div className="email">{student.email}</div>
                                        <div className="taz">
                                            TAZ: {student.taz || 'NULL'}
                                        </div>
                                    </label>

                                </div>
                                <input
                                    type="number"
                                    className="student-hours-input"
                                    placeholder="Hrs"
                                    value={student.hoursAssigned}
                                    disabled={!student.isSelected}
                                    onChange={(e) =>
                                        setStudentHours(student.id, parseInt(e.target.value, 10) || 0)
                                    }
                                />
                            </div>
                        ))}
                </div>

                <button type="submit" id="create-group-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add All Manual Hours'}
                </button>

                <div className="form-group csv-import-section">
                    <label>Import Selections via CSV</label>
                    <p className="csv-instruction-text">
                        Format: No headers. (NO HEADER ROW!!! just the lines) <br />
                        Column 1: taz, Column 2: Hours. <br />
                        Example: <br />
                        <code>215671066, 8</code> <br />
                        <code>213598410, 23</code> <br />
                        <code>423423562, 10</code>
                    </p>

                    <div className="csv-import-row">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            value={csvFile ? undefined : ''}
                        />
                        <button
                            type="button"
                            className="csv-apply-btn"
                            onClick={handleCsvImport}
                            disabled={!csvFile}
                        >
                            Apply CSV
                        </button>
                    </div>
                </div>
            </form>

            <hr className="section-divider" />

            <h2>Delete Manual Entries</h2>
            <p className="description">
                Paste a list of Manual Entry UUIDs or Batch UUIDs to delete them.
            </p>

            <form onSubmit={handleDeleteSubmit}>
                <div className="form-group">
                    <label htmlFor="delete-manual-ids-input">
                        Entry or Batch IDs (one per line)
                    </label>
                    <textarea
                        id="delete-manual-ids-input"
                        className="uuids-input"
                        placeholder="entry_uuid_1...&#10;batch_uuid_1..."
                        required
                        value={deleteIds}
                        onChange={(e) => setDeleteIds(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    id="delete-manual-button"
                    className="button-danger"
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Listed Entries'}
                </button>
            </form>
        </section>
    );
}