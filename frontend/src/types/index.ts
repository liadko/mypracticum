export type ContactType = 'client' | 'mentor' | 'therapist'

export interface BaseContact {
    id: string
    name: string
    type: ContactType
}

export interface ClientContact extends BaseContact {
    type: 'client'
}

export interface MentorContact extends BaseContact {
    type: 'mentor'
    email: string
    specialty: 'clinical' | 'dynamic' | 'skateboarder'
    phone?: string
}

export interface TherapistContact extends BaseContact {
    type: 'therapist'
}

export type Contact =
    | ClientContact
    | MentorContact
    | TherapistContact

// You don’t want callers to pass `id` or `created_at` (the server assigns those),
export type NewContact = Omit<Contact, 'id'>



export interface Entry {
    id: string          // uuid
    date: string        // "YYYY-MM-DD"
    contactId: string   // FK → Contact.id
    approved: boolean
}

export interface NewEntry {
  contactId: string
  date: string       // "YYYY-MM-DD"
}


