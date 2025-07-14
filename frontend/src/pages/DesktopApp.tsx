import { useState } from 'react'
import TherapistPage from './TherapistPage'
import MentorPage from './MentorPage'
import ClientPage from './ClientPage'

import { useEntries } from '../context/EntriesContext'
import './DesktopApp.css'
import { pageTitle } from '../i18n/he'
import { contactTypes, type ContactType } from '../types'

interface DesktopAppProps {
    userName: string
}


const DesktopApp: React.FC<DesktopAppProps> = ({ userName }) => {
    const [activePage, setActivePage] = useState<ContactType>("client")


    const {
        loading,
        error,
    } = useEntries()

    if (loading) return <div>Loading your personal hours…</div>
    if (error) return <div>Oops, something went wrong: {error.message}</div>

    return (
        <div className="desktop-app">
            {/* HEADER */}
            {/* HEADER */}
            <header className="header">
                {/* Left block */}
                <div className="header-left">
                    <img src="/signature.png" alt="Signature" className="signature-image" />
                    <label className="agreement">
                        <span className="agreement-text">אני מאשר/ת את כל הדיווחים</span>
                        <img src="/checkbox.svg" alt="אישור" className="agreement-checkbox" />
                    </label>
                </div>

                {/* Title */}
                <h1>{userName}</h1>

                {/* Right block */}
                <div className="header-right">
                    <span className="status">
                        {false ? '...שומר שינויים' : 'כל השינויים שמורים'}
                    </span>
                    <img src="/logo-text.png" alt="Logo" className="header-logo" />
                </div>
            </header>

            {/* NAV BAR */}
            <nav className="nav-bar">
                {contactTypes.map((page) => (
                    <button
                        key={page}
                        className={`nav-button ${activePage === page ? 'active' : ''} ${activePage}-page-theme`}
                        onClick={() => setActivePage(page)}
                    >
                        {pageTitle[page]}
                    </button>
                ))}
            </nav>

            {/* MAIN CONTENT */}
            {activePage === "therapist" && <TherapistPage />}
            {activePage === "mentor" && <MentorPage />}
            {activePage === "client" && <ClientPage />}
        </div>
    )
}

export default DesktopApp
