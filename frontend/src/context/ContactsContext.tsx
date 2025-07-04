import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import type { Contact, ContactType, NewContact } from '../types'
import * as D from '../domain/contacts'
import * as S from '../services/contactsService'

interface ContactsProviderProps {
  studentId: string
  children: React.ReactNode
}

interface ContactsContextType {
  contacts: Contact[]
  contactsById: Record<string, Contact>
  getContactsByType: (type: ContactType) => Contact[]
  getContactById: (id: string) => Contact | undefined
  addContact: (c: NewContact) => Promise<Contact>
  updateContact: (id: string, newContact: NewContact) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([])

  // load on mount
  useEffect(() => {
    S.fetchAllContacts()
      .then(setContacts)
      .catch(console.error)
  }, [])

  const addContact = useCallback(async (newC: NewContact) => {
    const created = await S.createContact(newC)
    setContacts(cs => D.addContact(cs, created))
    return created
  }, [])

  const updateContact = useCallback(async (id: string, newContact: NewContact) => {
    const updatedContact = await S.updateContact(id, newContact)
    setContacts(prev => {
      const without = D.removeContact(prev, updatedContact.id)
      return D.addContact(without, updatedContact)
    })
    return updatedContact
  }, [])

  const deleteContact = useCallback(async (id: string) => {
    await S.deleteContact(id)
    setContacts(cs => D.removeContact(cs, id))
  }, [])

  const contactsById = useMemo(() => {
    const map: Record<string, Contact> = {}
    contacts.forEach(c => { map[c.id] = c })
    return map
  }, [contacts])

  const getContactsByType = useCallback(
    (type: ContactType) => D.getContactsByType(contacts, type),
    [contacts]
  )

  const getContactById = useCallback(
    (id: string) => D.getContactById(contacts, id),
    [contacts]
  )

  return (
    <ContactsContext.Provider value={{
      contacts,
      contactsById,
      getContactsByType,
      getContactById,
      addContact,
      updateContact,
      deleteContact
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
