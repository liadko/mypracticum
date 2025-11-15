import { useState } from 'react';
import './AdminPage.css';
import { StudentsForm } from '../../components/Admin/StudentsForm';
import { EntriesForm } from '../../components/Admin/EntriesForm';
import { ManualEntriesForm } from '../../components/Admin/ManualEntriesForm';

type AdminTab =
    | 'page-import-students'
    | 'page-approve-entries'
    | 'page-manual-entries';

export default function AdminPage() {
    const [logs, setLogs] = useState<string>('');
    const [activeTab, setActiveTab] = useState<AdminTab>('page-import-students');

    // A single, shared logging function passed to all components
    const logMessage = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        // Use callback form of setState to get the latest 'logs'
        setLogs((prevLogs) => `[${timestamp}] ${message}\n` + prevLogs);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'page-import-students':
                return <StudentsForm logMessage={logMessage} />;
            case 'page-approve-entries':
                return <EntriesForm logMessage={logMessage} />;
            case 'page-manual-entries':
                return <ManualEntriesForm logMessage={logMessage} />;
            default:
                return null;
        }
    };

    return (
        <>
            <header>
                <h1>My Practicum - Admin Portal</h1>
            </header>

            <main>
                <nav className="tab-nav">
                    <button
                        className={`tab-button ${activeTab === 'page-import-students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('page-import-students')}
                    >
                        Add Students
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'page-approve-entries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('page-approve-entries')}
                    >
                        Manage Entries
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'page-manual-entries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('page-manual-entries')}
                    >
                        Manage Manual Entries
                    </button>
                </nav>

                {/* Render the active tab's content */}
                {renderTabContent()}

                <section className="admin-card">
                    <h2>Logs & Results</h2>
                    <div id="log-output">
                        {logs || 'Logs will appear here...'}
                    </div>
                </section>
            </main>
        </>
    );
}
