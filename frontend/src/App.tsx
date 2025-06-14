import DesktopApp from './pages/DesktopApp'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { EntriesProvider } from './context/EntriesContext';

const theme = createTheme({
    palette: {
        primary: {
            //main: '#3A75C4', // blue
            // main: '#f9223c', // pink
            main: '#00A495', // green
        },
        secondary: {
            main: '#00ff00',
        },

    },
});

export default function App() {
    return (
        <EntriesProvider studentId='215671066'>
            <ThemeProvider theme={theme}>
                <DesktopApp userName='שגי קורן' />
            </ThemeProvider>
        </EntriesProvider>
    );
}

