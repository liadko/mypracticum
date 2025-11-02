import React, { useMemo } from 'react';
import type { ContactType, Entry, ManualEntry } from '../../types';
import { useContacts } from '../../context/ContactsContext';
import './Tooltip.css';

interface TooltipContentProps {
    page: ContactType;
    entries: Entry[];
    manualEntries: ManualEntry[];
    entryCounts: Record<string, number>;
}

// A helper component to render the list of manual entries
const ManualEntryList: React.FC<{ entries: ManualEntry[] }> = ({ entries }) => {
    if (entries.length === 0) {
        return null; // Don't render anything if the list is empty
    }

    return (
        <div className="tooltip-manual-entries">
            <hr className="tooltip-divider" />
            <span className="tooltip-list-title">שעות נוספות</span>
            <ul className="tooltip-list">
                {entries.map(entry => (
                    <li key={entry.id}>
                        {entry.cause}: <div className='number'>{entry.hours}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function TooltipContent({
    page,
    entries,
    manualEntries,
    entryCounts,
}: TooltipContentProps) {

    const { getContactById } = useContacts()

    // 1. Find the manual entries that match the current page type
    const relevantManualEntries = useMemo(() => {
        return manualEntries.filter(me => me.type === page);
    }, [manualEntries, page]);

    const awaitingApproval = useMemo(() => {
        return entries.filter(e => getContactById(e.contactId)?.type === "mentor" && !e.approved).length;
    }, [entries]);

    // 2. This is the main tooltip content, including the manual list
    return (
        <span
            className='tooltip-text'
            // Stop click/mousedown events from bubbling up to the button,
            // which would prevent the tooltip from being read.
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
            {(() => {
                // This is your original switch statement, using props
                switch (page) {
                    case 'mentor':
                        return (
                            <>
                                דיווחים מאושרים: <div className='number'>{entryCounts[page]}</div><br />
                                ממתינים לאישור: <div className='number'>{awaitingApproval}</div><br />
                            </>
                        );
                    case 'therapist':
                        return (
                            <>
                                שעות שדיווחת: <div className='number'>{entryCounts[page]}</div><br />
                            </>
                        );
                    case 'client':
                        return (
                            <>
                                שעות שדיווחת:  <div className='number'>{entryCounts[page]}</div><br />
                            </>
                        );
                }
            })()}

            {/* 3. Render the new list of manual entries */}
            <ManualEntryList entries={relevantManualEntries} />
        </span>
    );
}