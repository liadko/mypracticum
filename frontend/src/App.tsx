import DesktopApp from './pages/DesktopApp'
import { EntriesProvider } from './context/EntriesContext';

export default function App() {
    return (
        <EntriesProvider studentId='215671066'>
                <DesktopApp userName='שגי קורן' />
        </EntriesProvider>
    );
}

