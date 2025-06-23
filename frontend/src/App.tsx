import DesktopApp from './pages/DesktopApp'
import { EntriesProvider } from './context/EntriesContext';
import { ContactsProvider } from './context/ContactsContext';

export default function App() {
    return (
        <ContactsProvider studentId='215671066'>
            <EntriesProvider studentId='215671066'>
                <DesktopApp userName='שגי קורן' />
            </EntriesProvider>
        </ContactsProvider>
    );
}

