import DesktopApp from './pages/DesktopApp'
import { EntriesProvider } from './context/EntriesContext';
import { ContactsProvider } from './context/ContactsContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
    return (
        <>
            <ContactsProvider studentId='215671066'>
                <EntriesProvider studentId='215671066'>
                    <DesktopApp userName='שגי קורן' />
                </EntriesProvider>
            </ContactsProvider>
            <div dir="rtl">
                <Toaster
                    position="bottom-center"
                    containerStyle={{ zIndex: 9999 }}          // ensure it sits above your dialog
                    toastOptions={{
                        // sensible defaults
                        success: { style: { background: 'var(--main-color)', color: '#fff' } },
                        error: { style: { background: '#f44336', color: '#fff' } },
                        style: { zIndex: 9999 }
                    }}

                />
            </div>
        </>

    );
}

