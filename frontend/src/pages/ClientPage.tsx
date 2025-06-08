import { CalendarWithList } from "../components/CalendarWithList";
import { useEntries } from "../context/EntriesContext";
import type { ClientEntry } from "../types";

// show the client’s name or a placeholder
function renderClientExtra(entry: ClientEntry) {
  return <input></input>
}

export default function ClientsPage() {
  const { clientEntries, toggleDay } = useEntries();

  return (
    <CalendarWithList<ClientEntry>
      title="שעות מטופלים פרטיים"
      entries={clientEntries}
      hoursNeeded={300}
      onDayToggle={(date) => toggleDay("client", date)}
      renderExtra={renderClientExtra}
    />
  );
}
