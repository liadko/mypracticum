import { useCallback } from 'react'
import { CalendarWithList } from "../components/CalendarWithList";
import { ClientNameInput } from "../components/ClientNameInput";
import { useEntries } from "../context/EntriesContext";
import type { ClientEntry } from "../types";

export default function ClientsPage() {
  // Let's assume your context provides an `isOffline` state for the "circuit breaker" idea
  const { clientEntries, toggleDay, updateClientName, error } = useEntries();

  const renderClientExtra = useCallback(
    (entry: ClientEntry) => {
      return (
        <ClientNameInput
          value={entry.clientName}
          onUpdate={(newName) => updateClientName(entry.id, newName)}
          disabled={!!error}
        />
      );
    },
    [updateClientName, error] // Dependencies for the callback
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
