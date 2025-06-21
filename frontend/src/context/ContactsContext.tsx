import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'
import type { Contact, ContactType, NewContact } from '../types'

interface ContactsContextType {
    contacts: Contact[]
    contactsById: Record<string, Contact>
    getContactsByType: (type: ContactType) => Contact[]
    addContact: (c: NewContact) => Promise<Contact>
    updateContact: (c: Contact) => Promise<Contact>
    deleteContact: (id: string) => Promise<void>
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

export const ContactsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [contacts, setContacts] = useState<Contact[]>([])

    // 1. Load on mount
    useEffect(() => {
        fetch('/api/contacts')
            .then(res => res.json())
            .then(setContacts)
            .catch(console.error)
    }, [])

    // 2. CRUD ops
    const addContact = useCallback(
        async (newC: NewContact): Promise<Contact> => {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newC),
            })
            if (!res.ok) throw new Error(res.statusText)
            const created: Contact = await res.json()
            setContacts(cs => [...cs, created])
            return created
        },
        []
    )

    const updateContact = useCallback(
        async (c: Contact): Promise<Contact> => {
            const res = await fetch(`/api/contacts/${c.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c),
            })
            if (!res.ok) throw new Error(res.statusText)
            const updated: Contact = await res.json()
            setContacts(cs => cs.map(x => (x.id === updated.id ? updated : x)))
            return updated
        },
        []
    )

    const deleteContact = useCallback(
        async (id: string): Promise<void> => {
            const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(res.statusText)
            setContacts(cs => cs.filter(x => x.id !== id))
        },
        []
    )

    // 3. Helpers
    const contactsById = useMemo(() => {
        const m: Record<string, Contact> = {}
        contacts.forEach(c => { m[c.id] = c })
        return m
    }, [contacts])

    const getContactsByType = useCallback(
        (type: ContactType) =>
            contacts.filter(c => c.type === type),
        [contacts])

    return (
        <ContactsContext.Provider value={{
            contacts,
            contactsById,
            getContactsByType,
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
