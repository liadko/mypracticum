import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import type { Contact, ContactType, NewContact } from '../types'
import * as domain from '../domain/contacts'
import * as api from '../api/contactsApi'

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
  //deleteContact: (id: string) => Promise<void>
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([])

  // load on mount
  useEffect(() => {
    api.fetchAllContacts()
      .then(setContacts)
      .catch(console.error)
  }, [])

  const addContact = useCallback(async (newC: NewContact) => {
    const created = await api.createContact(newC)
    setContacts(cs => domain.addContact(cs, created))
    return created
  }, [])

  const updateContact = useCallback(async (id: string, newContact: NewContact) => {
    const updatedContact = await api.updateContact(id, newContact)
    setContacts(prev => {
      const without = domain.removeContact(prev, updatedContact.id)
      return domain.addContact(without, updatedContact)
    })
    return updatedContact
  }, [])

  // const deleteContact = useCallback(async (id: string) => {
  //   await api.deleteContact(id)
  //   setContacts(cs => domain.removeContact(cs, id))
  // }, [])

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

  return (
    <ContactsContext.Provider value={{
      contacts,
      contactsById,
      getContactsByType,
      getContactById,
      addContact,
      updateContact,
      //deleteContact
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
