import { CalendarWithList } from "../components/CalendarWithList";
import { useEntries } from "../context/EntriesContext";
import type { MentorEntry } from "../types";
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: { primary: { main: '#3A75C4' } } // blue
})

// 1) For now we just show a placeholder for the mentor’s name
function renderMentorExtra(entry: MentorEntry) {
  return entry.mentor?.name ?? "<בחר מדריך>";
}

export default function MentorPage() {
  const { mentorEntries, toggleDay } = useEntries();

  return (
    <ThemeProvider theme={theme}>
      <div className='mentor-page'>
        <CalendarWithList<MentorEntry>
          title="שעות הדרכה"
          entries={mentorEntries}
          hoursNeeded={150}
          onDayToggle={(date) => toggleDay("mentor", date)}
          renderExtra={renderMentorExtra}
        /* no renderItemActions until mentors exist */
        />
      </div>

    </ThemeProvider>
  );
}