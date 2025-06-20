import { useEntries, useContacts } from '../context'
import { CalendarWithList } from '../components/CalendarWithList'
import type { ClientEntry, Contact, Entry } from '../types'

export default function ClientPage() {
  // pull all client‐type contacts & entries from context
  const contacts = useContacts().filter((c : Contact)=>c.type==='client')
  const entries = useEntries().entries.filter((e : Entry)=>e.contactId&&contacts.some(c=>c.id===e.contactId)) as ClientEntry[]

  return (
    <CalendarWithList<ClientEntry>
      contacts={{} as any}
      entries={entries}
      hoursNeeded={300}
      titleText='שעות הטיפול הפרטיות עם'
      onEntryToggle={(contactId,date)=>useEntries().toggleEntry(contactId,date)}
      renderExtra={e=>/* your old ClientNameInput */null}
    />
  )
}