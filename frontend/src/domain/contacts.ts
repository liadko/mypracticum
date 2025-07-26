import type { Contact, ContactType, NewContact } from '../types'

// Pure helpers for in-memory contact list operations
export function addContact(list: Contact[], contact: Contact): Contact[] {
  const newList = [...list, contact]
  console.log(newList)
  return newList.sort((a, b) => a.name.localeCompare(b.name))
}

export function removeContact(list: Contact[], id: string): Contact[] {
  return list.filter(c => c.id !== id)
}

export function getContactsByType(list: Contact[], type: ContactType): Contact[] {
  return list.filter(c => c.type === type)
}

export function getContactById(list: Contact[], id: String): Contact | undefined {
  return list.find(c => c.id === id)
}

export function validateContact(c: NewContact): Error | null {
  // 1) Name must be non-empty
  if (!c.name.trim()) {
    return new Error('יש למלא שם')
  }

  // Helpers:
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[0-9+\-\s()]{5,20}$/

  // 2) Mentor must have a valid email
  if (c.type === 'mentor') {
    if (!c.email || !emailRegex.test(c.email)) {
      return new Error('אנא הזן כתובת אימייל תקינה למדריך')
    }
  }

  // 3) Mentor & Therapist must have a phone
  if ((c.type === 'mentor' || c.type === 'therapist')) {
    if (!c.phone || !phoneRegex.test(c.phone)) {
      return new Error('אנא הזן מספר טלפון חוקי')
    }
  }

  // 4) Mentor & Therapist must have a specialty
  if ((c.type === 'mentor' || c.type === 'therapist') && !c.specialty?.trim()) {
    return new Error('יש להזין תחום התמחות')
  }

  // All good!
  return null
}
