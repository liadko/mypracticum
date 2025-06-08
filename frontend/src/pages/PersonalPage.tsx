import { CalendarWithList } from "../components/CalendarWithList";
import { useEntries } from "../context/EntriesContext";
import type { PersonalEntry } from "../types";

// show the chosen external therapist’s name or a placeholder
function renderPersonalExtra(entry: PersonalEntry) {
  return entry.externalTherapist?.name ?? "<בחר מטפל חיצוני>";
}

export default function PersonalPage() {
  const { personalEntries, toggleDay } = useEntries();

  return (
    <CalendarWithList<PersonalEntry>
      title="שעות טיפול אישי"
      entries={personalEntries}
      hoursNeeded={100}
      onDayToggle={(date) => toggleDay("personal", date)}
      renderExtra={renderPersonalExtra}
    />
  );
}