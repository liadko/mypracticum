import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import { contactTypes, type Contact, type ContactType, type NewContact } from '../types'
import * as domain from '../domain/contacts'
import * as api from '../api/contactsApi'
import { showAsyncToast, showAsyncToastWithError } from '../utils/toast'
import { useSelected } from './useSelected'
import { HttpError } from '../api/errors'

interface ContactsProviderProps {
  children: React.ReactNode
}

interface ContactsContextType {
  contacts: Contact[]
  contactsById: Record<string, Contact>
  getContactsByType: (type: ContactType) => Contact[]
  getContactById: (id: string) => Contact | undefined
  addContact: (c: NewContact) => Promise<Contact>
  updateContact: (id: string, newContact: NewContact) => Promise<Contact>
  inviteContact: (id: string) => Promise<Contact>

  loadingC: boolean
  errorC: Error | null


  getSelected: (type: ContactType) => string
  setSelected: (type: ContactType, id: string) => void

  activePage: ContactType
  setActivePage: (page: ContactType) => void

}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null) // fatal error

  const [activePage, setActivePage] = useState<ContactType>('client')
  const { getSelected, setSelected } = useSelected()

  // load on mount
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    api.fetchAllContacts()
      .then(fetched => {
        if (!isMounted) return
        setContacts(fetched)
        initSelected(fetched)
      })
      .catch(err => {
        if (!isMounted) return
        console.error(err)
        setError(Error(`Oops! Something happened: ${err}`))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])


  const addContact = useCallback(async (newC: NewContact) => {
    return showAsyncToastWithError(
      api.createContact(newC).then(created => {
        setContacts(cs => domain.addContact(cs, created))
        return created
      }),
      {
        loading: "מוסיף...",
        success: "נוסף בהצלחה",
        error: (err: unknown) => {
          if (err instanceof HttpError && err.status === 409) {
            return "איש קשר עם אימייל זה כבר קיים";
          }

          // Return a generic message for all other errors
          return "נכשל בהוספה";
        },
      }
    )
  }, [])


  const updateContact = useCallback(async (id: string, newContact: NewContact) => {
    return showAsyncToast(
      api.updateContact(id, newContact).then(updatedContact => {
        setContacts(prev => {
          const without = domain.removeContact(prev, updatedContact.id)
          return domain.addContact(without, updatedContact)
        })
        return updatedContact
      }),
      {
        loading: "מעדכן...",
        success: "עודכן בהצלחה",
        error: "נכשל בעדכון",
      }
    )
  }, [])


  const inviteContact = useCallback(async (id: string) => {
    return showAsyncToast(
      api.inviteMentorContact(id),
      {
        loading: "שולח הזמנה...",
        success: "הוזמן בהצלחה",
        error: "נכשל בשליחת ההזמנה",
      }
    )
  }, [])


  const contactsById = useMemo(() => {
    const map: Record<string, Contact> = {}
    contacts.forEach(c => { map[c.id] = c })
    return map
  }, [contacts])


  const getContactsByType = useCallback(
    (type: ContactType) => domain.getContactsByType(contacts, type),
    [contacts]
  )

  const getContactById = useCallback(
    (id: string) => domain.getContactById(contacts, id),
    [contacts]
  )

  const initSelected = useCallback((contacts: Contact[]) => {
    for (const t of contactTypes) {
      const contactsOfType = domain.getContactsByType(contacts, t)
      let isContactMissing =
        domain.getContactById(contacts, getSelected(t)) === undefined
        || getSelected(t) == ''

      if (isContactMissing && contactsOfType.length > 0)
        setSelected(t, contactsOfType[0].id)
    }
  }, [])

  return (
    <ContactsContext.Provider value={{
      contacts,
      contactsById,
      getContactsByType,
      getContactById,
      addContact,
      updateContact,
      inviteContact,

      loadingC: loading,
      errorC: error,

      getSelected,
      setSelected,

      activePage,
      setActivePage

    }}>
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts(): ContactsContextType {
  const ctx = useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts must be inside ContactsProvider')
  return ctx
}
