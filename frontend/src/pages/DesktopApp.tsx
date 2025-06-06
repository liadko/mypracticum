import { useState } from 'react';
import Calendar from "../components/Calendar/Calendar";
import './DesktopApp.css';
import type { ClientsPageState, MentorEntry, MentorPageState, PersonalEntry, PersonalPageState } from '../types';
import PersonalPage from './PersonalPage';
import MentorPage from './MentorPage';
import ClientsPage from './ClientsPage';

interface DesktopAppProps {
    userName: string;
}

const pages = ['Personal', 'Mentor', 'Clients'];

const DesktopApp: React.FC<DesktopAppProps> = ({ userName }) => {
    const [activePage, setActivePage] = useState<string>(pages[0]);

    const [personalPage, setPersonalPage] = useState<PersonalPageState>({
        title: "שעות טיפול אישי",
        totalHours: 0,
        entries: [],
    });

    const [mentorPage, setMentorPage] = useState<MentorPageState>({
        title: "שעות הדרכה",
        totalHours: 0,
        entries: [],
    });

    const [clientsPage, setClientsPage] = useState<ClientsPageState>({
        title: "שעות טיפול דינמי",
        totalHours: 0,
        entries: [],
    });



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

                {/* {/* CALENDAR (left) 
                <div className='date-picker'>
                    <Calendar<PersonalEntry> selectedDates={personalPage.entries} onSelectedDatesChange={personalPage.SetPersonalPage} />
                </div>

                {/*SELECTED LIST (right) 
                <div className="selected-list">
                    <div className='selected-list-header'>
                        <p className='selected-list-counter'>35 / 100</p>
                        <p className='selected-list-title'>שעות מטופלים</p>

                    </div>
                    <div className="selected-list-items">

                        {selectedDates.length === 0 && <p>No dates selected.</p>}
                        {selectedDates.map(entry => (
                            <div key={entry.id} className="selected-item">
                                <span className="date">{entry.date}</span>
                                <span className="hours">{entry.hoursSpent}h</span>
                            </div>
                        ))}
                    </div>
                </div> */}
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
            return "אישי"
        case "Clients":
            return "מטופלים"
        default:
            return "לא הצלחתי לתרגם!"
    }

}