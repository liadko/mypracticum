import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminApi from '../../api/adminApi';
import type { FreezeReason, StudentResponse } from '../../types';

interface FreezeStudentsFormProps {
    logMessage: (message: string) => void;
}

type StatusFilter = 'all' | 'active' | 'frozen';

const REASONS: { value: FreezeReason; label: string }[] = [
    { value: 'on_leave', label: 'בחופשה' },
    { value: 'left_program', label: 'עזב/ה את התוכנית' },
    { value: 'finished', label: 'סיים/ה (הטפסים נשלחו)' },
    { value: 'other', label: 'אחר' },
];

/**
 * Pulls identifiers from the first column of pasted or uploaded CSV text.
 * Anything without a digit or @ is treated as a header row and skipped.
 */
function parseIdentifiers(text: string): string[] {
    const identifiers = text
        .replace(/^﻿/, '')
        .split(/\r?\n/)
        .map((line) => line.split(/[,;\t]/)[0].replace(/"/g, '').trim())
        .filter((cell) => /[\d@]/.test(cell));
    return Array.from(new Set(identifiers));
}

export function FreezeStudentsForm({ logMessage }: FreezeStudentsFormProps) {
    const [students, setStudents] = useState<StudentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const [csvText, setCsvText] = useState('');
    const [reason, setReason] = useState<FreezeReason>('on_leave');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            setStudents(await adminApi.getStudents());
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load students');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const visibleStudents = useMemo(() => {
        const term = search.trim().toLowerCase();
        return students.filter((s) => {
            const status = s.status === 'frozen' ? 'frozen' : 'active';
            if (statusFilter !== 'all' && status !== statusFilter) return false;
            if (!term) return true;
            return [`${s.firstName} ${s.lastName}`, s.email, s.taz].some((value) =>
                (value || '').toLowerCase().includes(term),
            );
        });
    }, [students, search, statusFilter]);

    const csvIdentifiers = useMemo(() => parseIdentifiers(csvText), [csvText]);
    const targetCount = selected.size + csvIdentifiers.length;

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleFile = async (file: File | undefined) => {
        if (file) setCsvText(await file.text());
    };

    const submit = async (status: 'frozen' | 'active') => {
        if (targetCount === 0) {
            logMessage('Error: select students or add a CSV first.');
            return;
        }
        const verb = status === 'frozen' ? 'Freeze' : 'Unfreeze';
        if (!window.confirm(`${verb} ${targetCount} student(s)?`)) return;

        setIsSubmitting(true);
        logMessage(`${verb} request for ${targetCount} student(s)...`);
        try {
            const result = await adminApi.setStudentStatus({
                identifiers: [...selected, ...csvIdentifiers],
                status,
                ...(status === 'frozen' && { reason, note }),
            });
            logMessage(`SUCCESS: ${result.updated} of ${result.total} updated.`);
            if (result.notFound?.length) logMessage(`Not found: ${result.notFound.join(', ')}`);
            if (result.failed?.length) logMessage(`Failed: ${result.failed.join(', ')}`);
            setSelected(new Set());
            setCsvText('');
            setNote('');
            await loadStudents();
        } catch (err: unknown) {
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="admin-card admin-page active" id="page-freeze-students">
            <h2>Freeze Students</h2>
            <p className="description">
                A frozen student can still log in and view their hours, but can't change anything, and
                mentors can't approve their hours. You can still do everything here. Nothing is deleted.
            </p>

            <div className="form-group">
                <label htmlFor="freeze-search-input">Select Students</label>
                <input
                    type="search"
                    id="freeze-search-input"
                    placeholder="חפש תלמיד לפי שם, אימייל או ת״ז..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="freeze-status-filter">Show</label>
                <select
                    id="freeze-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                    <option value="all">All students</option>
                    <option value="active">Active only</option>
                    <option value="frozen">Frozen only</option>
                </select>
            </div>

            <div className="student-list-container">
                {isLoading && <p className="loading-text">Loading students...</p>}
                {error && <p className="loading-text">{error}</p>}
                {!isLoading &&
                    !error &&
                    visibleStudents.map((student) => (
                        <div key={student.id} className="student-list-item">
                            <input
                                type="checkbox"
                                className="student-select-check"
                                id={`freeze-${student.id}`}
                                checked={selected.has(student.id)}
                                onChange={() => toggle(student.id)}
                            />
                            <div className="student-info">
                                <label htmlFor={`freeze-${student.id}`} style={{ cursor: 'pointer' }}>
                                    <div className="name">
                                        {student.firstName} {student.lastName}
                                        {student.status === 'frozen' && ' (בהקפאה)'}
                                    </div>
                                    <div className="email">{student.email}</div>
                                    <div className="taz">TAZ: {student.taz || 'NULL'}</div>
                                </label>
                            </div>
                        </div>
                    ))}
            </div>

            <div className="form-group csv-import-section">
                <label htmlFor="freeze-csv-input">Or add students by CSV</label>
                <p className="csv-instruction-text">
                    First column is a TAZ or email, one student per line. A header row is fine.
                </p>
                <div className="csv-import-row">
                    <input type="file" accept=".csv,.txt" onChange={(e) => handleFile(e.target.files?.[0])} />
                </div>
                <textarea
                    id="freeze-csv-input"
                    className="uuids-input"
                    placeholder={'215671066\n213598410'}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="freeze-reason-select">Freeze reason</label>
                <select
                    id="freeze-reason-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as FreezeReason)}
                >
                    {REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="freeze-note-input">Note (optional)</label>
                <input
                    type="text"
                    id="freeze-note-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <p className="description">
                {selected.size} selected, {csvIdentifiers.length} from CSV
            </p>
            <button type="button" className="button-danger" disabled={isSubmitting} onClick={() => submit('frozen')}>
                Freeze
            </button>{' '}
            <button type="button" disabled={isSubmitting} onClick={() => submit('active')}>
                Unfreeze
            </button>
        </section>
    );
}
