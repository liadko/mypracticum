import { useContacts } from '../context/ContactsContext'
import { useEntries } from '../context/EntriesContext'
import { CalendarWithList } from '../components/CalendarWithList'
import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  palette: { primary: { main: '#00A495' } } // green
})

export default function ClientPage() {
  // pull all client‐type contacts & entries from context
  const { getContactsByType } = useContacts()
  const { entries } = useEntries()

  const contacts = useMemo(
    () => getContactsByType('client'),
    [getContactsByType]
  )

  const clientEntries = useMemo(
    () =>
      entries.filter(e =>
        contacts.some(c => c.id === e.contactId)
      ),
    [entries, contacts]
  )


  return (
    <ThemeProvider theme={theme}>
      <div className='client-page-theme'>
        <CalendarWithList
          contacts={contacts}
          entries={clientEntries}
          //hoursNeeded={300}
          contactType='client'
          onEntryToggle={useEntries().toggleEntry}
          //renderExtra={e =>/* your old ClientNameInput */null}
        />
      </div>
    </ThemeProvider>
  )
}