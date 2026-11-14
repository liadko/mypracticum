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

/**
 * A training-centre client whose student hasn't filled in any of the new centre
 * details yet. Filling in any one of them is enough.
 *
 * A migration copied each client's old free-text description into the centre
 * name, so a name identical to that text is not something the student entered
 * and doesn't count. Only a different name, a city, a contact person or a
 * phone does.
 */
export function needsCenterDetails(c: Contact): boolean {
  if (c.type !== 'client' || c.clientInstitution !== 'trainingCenter') return false
  const d = c.trainingCenter
  const name = d?.name?.trim() ?? ''
  const nameIsNew = name !== '' && name !== (c.clientTrainingCenterInfo ?? '').trim()
  return ![nameIsNew ? name : '', d?.city, d?.contactPerson, d?.contactPhone].some(v => v?.trim())
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
      return new Error('יש להזין כתובת אימייל תקינה למדריך')
    }
  }

  // 3) Mentor & Therapist must have a phone
  if ((c.type === 'mentor' || c.type === 'therapist')) {
    if (!c.phone || !phoneRegex.test(c.phone)) {
      return new Error('יש להזין מספר טלפון חוקי')
    }
  }

  // 4) Mentor & Therapist must have a specialty
  if ((c.type === 'mentor' || c.type === 'therapist') && !c.specialty?.trim()) {
    return new Error('יש להזין תחום התמחות')
  }

  // 5) Client must have institution, and if training center then info
  if (c.type === 'client') {
    if (c.clientInstitution !== 'privateClinic' && c.clientInstitution !== 'trainingCenter') {
      return new Error('יש לבחור מקור מסגרת טיפול תקינה')
    }
    if (c.clientInstitution === 'trainingCenter') {
      const details = c.trainingCenter
      const isComplete = !!details?.name.trim() && !!details.city.trim() && !!details.contactPerson.trim()
      // Older contacts already have their free-text description, so any of the
      // new fields are optional for them. New contacts must fill in all three.
      const isOlderContact = !!c.clientTrainingCenterInfo?.trim()
      if (!isComplete && !isOlderContact) {
        return new Error('יש למלא שם מרכז, עיר ואיש קשר')
      }
    }
  }


  // All good!
  return null
}
