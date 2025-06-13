import { useCallback } from 'react'
import { CalendarWithList } from "../components/CalendarWithList";
import { ClientNameInput } from "../components/Extras/ClientNameInput";
import { useEntries } from "../context/EntriesContext";
import type { ClientEntry } from "../types";

export default function ClientsPage() {
  const { clientEntries, toggleDay, handleUpdateClient, error } = useEntries();

  const renderClientExtra = useCallback(
    (entry: ClientEntry) => {
      return (
        <ClientNameInput
          id={entry.id}
          value={entry.clientName}
          onUpdate={(newName) => handleUpdateClient(entry.id, newName)}
          disabled={!!error}
        />
      );
    },
    [handleUpdateClient, error] // Dependencies for the callback
  );

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
