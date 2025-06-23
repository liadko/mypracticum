import type { Contact, ContactType } from '../types'

// Pure helpers for in-memory contact list operations
export function addContact(list: Contact[], contact: Contact): Contact[] {
  const newList = [...list, contact]
  return newList.sort((a, b) => a.name.localeCompare(b.name))
}

export function removeContact(list: Contact[], id: string): Contact[] {
  return list.filter(c => c.id !== id)
}

export function getContactsByType(list: Contact[], type: ContactType): Contact[] {
  return list.filter(c => c.type === type)
}
