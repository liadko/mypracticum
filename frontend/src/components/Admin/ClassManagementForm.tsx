import { useEffect, useState } from 'react';
import * as adminApi from '../../api/adminApi';
import type { AdminClass, CreateAdminClassRequest } from '../../types';

interface Props {
    logMessage: (message: string) => void;
}

const emptyClassRequest: CreateAdminClassRequest = {
    name: '',
    reportingStartDates: {
        client: '',
        mentor: '',
        therapist: '',
    },
};

export function ClassManagementForm({ logMessage }: Props) {
    const [classes, setClasses] = useState<AdminClass[]>([]);
    const [request, setRequest] = useState<CreateAdminClassRequest>(emptyClassRequest);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadClasses = async () => {
            try {
                setIsLoading(true);
                setClasses(await adminApi.getClasses());
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error while loading classes';
                logMessage(`Error loading classes: ${message}`);
            } finally {
                setIsLoading(false);
            }
        };
        void loadClasses();
    }, [logMessage]);

    const updateDate = (type: keyof CreateAdminClassRequest['reportingStartDates'], value: string) => {
        setRequest((current) => ({
            ...current,
            reportingStartDates: { ...current.reportingStartDates, [type]: value },
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const created = await adminApi.createClass({
                ...request,
                name: request.name.trim(),
            });
            setClasses((current) => [...current, created]);
            setRequest(emptyClassRequest);
            logMessage(`SUCCESS: Created class ${created.name}.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error while creating class';
            logMessage(`Error creating class: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="admin-card admin-page active" id="page-manage-classes">
            <h2>Manage Classes</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="class-name">Class name:</label>
                    <input
                        id="class-name"
                        value={request.name}
                        onChange={(event) => setRequest((current) => ({ ...current, name: event.target.value }))}
                        required
                    />
                </div>

                <p className="date-cutoff-explainer">
                    Example: if a reporting start date is 01.01.2026, marking on 31.12.2025 is illegal, and marking on 01.01.2026 is allowed.
                </p>

                <div className="form-group">
                    <label htmlFor="class-client-start-date">Client reporting start date:</label>
                    <input id="class-client-start-date" type="date" value={request.reportingStartDates.client} onChange={(event) => updateDate('client', event.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="class-mentor-start-date">Mentor reporting start date:</label>
                    <input id="class-mentor-start-date" type="date" value={request.reportingStartDates.mentor} onChange={(event) => updateDate('mentor', event.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="class-therapist-start-date">Therapist reporting start date:</label>
                    <input id="class-therapist-start-date" type="date" value={request.reportingStartDates.therapist} onChange={(event) => updateDate('therapist', event.target.value)} required />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Add Class'}
                </button>
            </form>

            <hr className="section-divider" />
            <h3>Existing Classes</h3>
            {isLoading ? <p>Loading classes...</p> : (
                <ul className="class-list">
                    {classes.map((classItem) => (
                        <li key={classItem.id}>
                            <strong>{classItem.name}</strong>
                            <span>Client: {classItem.reportingStartDates.client ?? '—'}</span>
                            <span>Mentor: {classItem.reportingStartDates.mentor ?? '—'}</span>
                            <span>Therapist: {classItem.reportingStartDates.therapist ?? '—'}</span>
                        </li>
                    ))}
                    {classes.length === 0 && <li>No classes yet.</li>}
                </ul>
            )}
        </section>
    );
}
