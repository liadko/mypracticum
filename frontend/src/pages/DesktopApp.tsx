import { useState } from 'react'
import TherapistPage from './TherapistPage'
import MentorPage from './MentorPage'
import ClientPage from './ClientPage'

import { useEntries } from '../context/EntriesContext'
import './DesktopApp.css'

interface DesktopAppProps {
    userName: string
}

const pages = ['therapist', 'mentor', 'client']

const DesktopApp: React.FC<DesktopAppProps> = ({ userName }) => {
    const {updatingServer} = useEntries();
    const [activePage, setActivePage] = useState<string>(pages[2])


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
                        {updatingServer ? '...שומר שינויים' : 'כל השינויים שמורים'}
                    </span>
                    <img src="/logo.png" alt="Logo" className="header-logo" />
                </div>
            </header>

            {/* NAV BAR */}
            <nav className="nav-bar">
                {pages.map((page) => (
                    <button
                        key={page}
                        className={`nav-button ${activePage === page ? 'active' : ''} ${activePage}-page`}
                        onClick={() => setActivePage(page)}
                    >
                        {translate(page)}
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


function translate(pageName: string) {
    switch (pageName) {
        case "mentor":
            return "הדרכה"
        case "personal":
            return "טיפול אישי"
        case "client":
            return "מטופלים פרטיים"
        default:
            return "לא הצלחתי לתרגם!"
    }

}