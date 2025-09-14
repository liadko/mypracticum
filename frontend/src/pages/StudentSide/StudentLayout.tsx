import { useState } from 'react'
import TherapistPage from './TherapistPage'
import MentorPage from './MentorPage'
import ClientPage from './ClientPage'
import '../DesktopApp.css'
import { pageTitle } from '../../i18n/he'
import { contactTypes, type ContactType } from '../../types'


export default function StudentLayout() {
    const [activePage, setActivePage] = useState<ContactType>("client")

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
                        <span className="nav-button--title">
                            {pageTitle[page]}
                        </span>
                        <span className="nav-button--subtitle">
                            50/150
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

