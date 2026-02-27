import { useState } from 'react';
import * as adminApi from '../../api/adminApi';

interface Props {
    logMessage: (message: string) => void;
}

export function EntriesForm({ logMessage }: Props) {
    const [ids, setIds] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Delete Form State ---
    const [deleteIds, setDeleteIds] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Delete Form Handler ---
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

        const invalid = idList.filter(
            (s) => !/^[0-9a-fA-F-]{36}$/.test(s) || s.length !== 36,
        );
        if (invalid.length > 0) {
            logMessage(`Error: Found ${invalid.length} invalid-looking IDs: \n${invalid.join(',\n')}`);
            return;
        }

        const confirmMsg = `Are you sure you want to permanently delete ${idList.length} entries?`;
        if (!window.confirm(confirmMsg)) {
            logMessage('Deletion canceled by user.');
            return;
        }

        setIsDeleting(true);
        logMessage(`Deleting ${idList.length} items...`);
        try {
            const result = await adminApi.deleteEntries(idList);
            logMessage('SUCCESS: Deletion complete.');
            logMessage(JSON.stringify(result, null, 2));
            setDeleteIds(''); // Clear form
        } catch (err: unknown) {
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const raw = ids.trim();
        if (!raw) {
            logMessage('Error: No IDs provided.');
            return;
        }

        const idList = Array.from(
            new Set(raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)),
        );

        // Basic UUID check (you can make this more robust)
        const invalid = idList.filter(
            (s) => !/^[0-9a-fA-F-]{36}$/.test(s) || s.length !== 36,
        );
        if (invalid.length > 0) {
            logMessage(`Error: Found ${invalid.length} invalid-looking IDs.`);
            return;
        }

        setIsLoading(true);
        logMessage(`Approving ${idList.length} entries…`);

        try {
            const result = await adminApi.approveEntries(idList);
            logMessage('SUCCESS: Bulk approval complete.');
            logMessage(JSON.stringify(result, null, 2));
            setIds(''); // Clear form on success
        } catch (err: unknown) {
            logMessage(`FATAL ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="admin-card admin-page active" id="page-approve-entries">
            <h2>Approve Entries</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="approve-ids-input">Entry IDs (one per line)</label>
                    <textarea
                        id="approve-ids-input"
                        className='uuids-input'
                        placeholder="id1&#10;id2&#10;id3"
                        required
                        value={ids}
                        onChange={(e) => setIds(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Approving...' : 'Approve Listed Entries'}
                </button>
            </form>

            <hr className="section-divider" />

            <h2>Delete Entries</h2>
            <p className="description">
                Paste a list of Entry UUIDs to delete them. (no commas)
            </p>

            <form onSubmit={handleDeleteSubmit}>
                <div className="form-group">
                    <label htmlFor="delete-ids-input">
                        Entry IDs (one per line)
                    </label>
                    <textarea
                        id="delete-ids-input"
                        className="uuids-input"
                        placeholder="entry_uuid_1...&#10;entry_uuid_2..."
                        required
                        value={deleteIds}
                        onChange={(e) => setDeleteIds(e.target.value)}
                        disabled={isDeleting}
                    />
                </div>
                <button
                    type="submit"
                    id="delete-entries-button"
                    className="button-danger"
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Listed Entries'}
                </button>
            </form>
        </section>
    );
}