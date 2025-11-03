import { useMemo } from 'react'
import TherapistPage from './TherapistPage'
import MentorPage from './MentorPage'
import ClientPage from './ClientPage'
import '../DesktopApp.css'
import { pageTitle } from '../../i18n/he'
import { contactTypes } from '../../types'
import { useEntries } from '../../context/EntriesContext'
import { useContacts } from '../../context/ContactsContext'
import TooltipContent from '../../components/Tooltip/TooltipContent'


const countGoals = { 'client': 300, 'mentor': 150, 'therapist': 100 }

export default function StudentLayout() {

    const { entries, manualEntries } = useEntries()
    const { activePage, setActivePage, getContactById } = useContacts()

    const entryCounts = useMemo(() => {
        const m: Record<string, number> = { 'client': 0, 'mentor': 0, 'therapist': 0 };
        for (const e of entries) {
            const type = getContactById(e.contactId)?.type
            if (!type) console.log(`entry ${e} has a contact with no type! or doesn't have a contact`)
            else if (type != 'mentor' || e.approved) m[type] = (m[type] ?? 0) + 1;
        }
        return m;
    }, [entries]);

    const manualEntryCount = useMemo(() => {
        const m: Record<string, number> = { 'client': 0, 'mentor': 0, 'therapist': 0 };
        for (const me of manualEntries) {
            const type = me.type
            if (!type) console.log(`entry ${me} has a contact with no type! or doesn't have a contact`)
            else m[type] = m[type] + me.hours;
        }
        return m;
    }, [manualEntries]);


    return (
        <>
            {/* NAV BAR */}
            <nav className="nav-bar">
                {contactTypes.map((page) => (
                    <button
                        key={page}
                        className={`nav-button ${activePage === page ? 'active' : ''} ${activePage}-page-theme`}
                        onClick={() => setActivePage(page)}
                    >

                        <TooltipContent
                            page={page}
                            entries={entries}
                            manualEntries={manualEntries}
                            entryCounts={entryCounts}
                        />
                        <span className="nav-button--title">
                            {pageTitle[page]}
                        </span>
                        <span className="nav-button--subtitle">
                            {entryCounts[page] + manualEntryCount[page]}/{countGoals[page]}
                        </span>
                    </button>
                ))}
            </nav>

            {/* MAIN CONTENT */}
            {activePage === "therapist" && <TherapistPage />}
            {activePage === "mentor" && <MentorPage />}
            {activePage === "client" && <ClientPage />}
        </>
    )
}

