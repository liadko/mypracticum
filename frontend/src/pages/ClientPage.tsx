import { useContacts } from '../context/ContactsContext'
import { useEntries } from '../context/EntriesContext'
import { CalendarWithList } from '../components/CalendarWithList'
import type { Entry } from '../types'

export default function ClientPage() {
  // pull all client‐type contacts & entries from context
  const contacts = useContacts().getContactsByType('client')

  const clientEntries = useEntries().entries.filter(
    (e: Entry) =>
      contacts.some((c) => c.id === e.contactId)
    ) as Entry[]

  return (
    <CalendarWithList
      contacts={{} as any}
      entries={clientEntries}
      hoursNeeded={300}
      titleText='שעות הטיפול הפרטיות עם'
      onEntryToggle={useEntries().toggleEntry}
      renderExtra={e =>/* your old ClientNameInput */null}
    />
  )
}