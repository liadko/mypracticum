import { useMemo } from 'react'
import TherapistPage from './TherapistPage'
import MentorPage from './MentorPage'
import ClientPage from './ClientPage'
import '../DesktopApp.css'
import { pageTitle } from '../../i18n/he'
import { contactTypes, type ContactType } from '../../types'
import { useEntries } from '../../context/EntriesContext'
import { useContacts } from '../../context/ContactsContext'
import { useAuth } from '../../context/AuthContext'


const countGoals = { 'client': 300, 'mentor': 150, 'therapist': 100 }

export default function StudentLayout() {

    const { entries } = useEntries()
    const { activePage, setActivePage, getContactById } = useContacts()
    const { getPastTherapyHours } = useAuth()

    const entryCounts = useMemo(() => {
        const m: Record<string, number> = { 'client': 0, 'mentor': 0, 'therapist': 0 };
        for (const e of entries) {
            const type = getContactById(e.contactId)?.type
            if (!type) console.log(`entry ${e} has a contact with no type! or doesn't have a contact`)
            else if (type != 'mentor' || e.approved) m[type] = (m[type] ?? 0) + 1;
        }
        return m;
    }, [entries]);

    const awaitingApproval = useMemo(() => {
        return entries.filter(e => getContactById(e.contactId)?.type === "mentor" && !e.approved).length;
    }, [entries]);

    const pastHours = getPastTherapyHours() ?? 0;

    const tooltip = (page: ContactType) => {

        return (
            <span
                className='tooltip-text'
                onMouseDown={(e: any) => e.stopPropagation()}
                onClick={(e: any) => e.stopPropagation()}
            >
                {(() => {
                    switch (page) {
                        case 'mentor':
                            return (
                                <>
                                    דיווחים מאושרים: {entryCounts[page]}<br />
                                    ממתינים לאישור: {awaitingApproval}<br />
                                </>
                            )
                        case 'therapist':
                            return (
                                <>
                                    שעות שדווחו: {entryCounts[page]}<br />
                                    {pastHours > 0 && (
                                        <>שעות טיפול עבר: {pastHours}<br /></>
                                    )}
                                </>
                            )
                        case 'client':
                            return (
                                <>
                                    שעות שדווחו: {entryCounts[page]}<br />
                                </>
                            )
                    }
                })()}
            </span>
        )

    }

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

                        {tooltip(page)}
                        <span className="nav-button--title">
                            {pageTitle[page]}
                        </span>
                        <span className="nav-button--subtitle">
                            {entryCounts[page]}/{countGoals[page]}
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

