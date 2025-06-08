import { useState } from 'react';
import Calendar from "../components/Calendar/Calendar";
import './DesktopApp.css';
import type { ClientPageState, MentorEntry, MentorPageState, PersonalEntry, PersonalPageState } from '../types';
import PersonalPage from './PersonalPage';
import MentorPage from './MentorPage';
import ClientsPage from './ClientsPage';
import { EntriesProvider, useEntries } from '../context/EntriesContext';

interface DesktopAppProps {
    userName: string;
}

const pages = ['Personal', 'Mentor', 'Clients'];

const DesktopApp: React.FC<DesktopAppProps> = ({ userName }) => {
    const [activePage, setActivePage] = useState<string>(pages[0]);

    const {
        personalEntries,
        togglePersonalDay,
        totalHours,
        loading,
        error,
    } = useEntries();
    
    if (loading) return <div>Loading your personal hours…</div>;
    if (error) return <div>Oops, something went wrong: {error.message}</div>;

    return (
            <div className="desktop-app">
                {/* HEADER */}
                <header className="header">
                    <h1>{userName}</h1>
                </header>

                {/* NAV BAR */}
                <nav className="nav-bar">
                    {pages.map((page) => (
                        <button
                            key={page}
                            className={`nav-button ${activePage === page ? 'active' : ''}`}
                            onClick={() => setActivePage(page)}
                        >
                            {translate(page)}
                        </button>
                    ))}
                </nav>

                {/* MAIN CONTENT */}
                <div className="content">
                    {activePage === "Personal" && <PersonalPage />}
                    {activePage === "Mentor" && <MentorPage />}
                    {activePage === "Clients" && <ClientsPage />}
                </div>
            </div>
    );
};

export default DesktopApp;


function translate(pageName: string) {
    switch (pageName) {
        case "Mentor":
            return "הדרכה"
        case "Personal":
            return "טיפול אישי"
        case "Clients":
            return "מטופלים פרטיים"
        default:
            return "לא הצלחתי לתרגם!"
    }

}