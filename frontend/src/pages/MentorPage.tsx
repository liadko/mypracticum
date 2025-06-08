import { CalendarWithList } from "../components/CalendarWithList";
import { useEntries } from "../context/EntriesContext";
import type { MentorEntry } from "../types";

// 1) For now we just show a placeholder for the mentor’s name
function renderMentorExtra(entry: MentorEntry) {
  return entry.mentor?.name ?? "<בחר מדריך>";
}

export default function MentorPage() {
  const { mentorEntries, toggleDay } = useEntries();

  return (
    <CalendarWithList<MentorEntry>
      title="שעות הדרכה"
      entries={mentorEntries}
      hoursNeeded={150}
      onDayToggle={(date) => toggleDay("mentor", date)}
      renderExtra={renderMentorExtra}
      /* no renderItemActions until mentors exist */
    />
  );
}