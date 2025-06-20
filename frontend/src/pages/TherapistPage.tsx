import { CalendarWithList } from "../components/CalendarWithList";
import { useEntries } from "../context/EntriesContext";
import type { PersonalEntry } from "../types";
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: { primary: { main: '#fc3d54' } } // pink
})

// show the chosen external therapist’s name or a placeholder
function renderPersonalExtra(entry: PersonalEntry) {
  return entry.externalTherapist?.name ?? "<בחר מטפל חיצוני>";
}

export default function PersonalPage() {
  const { personalEntries, toggleDay } = useEntries();

  return (
    <ThemeProvider theme={theme}>
      <div className='personal-page'>
        <CalendarWithList<PersonalEntry>
          title="שעות טיפול אישי"
          entries={personalEntries}
          hoursNeeded={100}
          onDayToggle={(date) => toggleDay("personal", date)}
          renderExtra={renderPersonalExtra}
        />
      </div>
    </ThemeProvider>
  );
}