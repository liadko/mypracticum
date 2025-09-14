export const contactTypes = ['therapist', 'mentor', 'client'] as const
export type ContactType = typeof contactTypes[number]


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
    specialty: string
    phone: string
}

export interface TherapistContact extends BaseContact {
    type: 'therapist'
    specialty: string
    phone: string

}


export interface Student {
    type: 'student'
    id: string
    name: string
}


export type Contact =
    | ClientContact
    | MentorContact
    | TherapistContact
    | Student

// You don’t want callers to pass `id` or `created_at` (the server assigns those),
export interface NewContact {
    type: ContactType
    name: string
    email?: string
    phone?: string
    specialty?: string
}


export interface Entry {
    id: string          // uuid
    date: string        // "YYYY-MM-DD"
    userId: string      // FK → User.id
    contactId: string   // FK → Contact.id
    approved: boolean
}

export interface NewEntry {
    contactId: string
    date: string       // "YYYY-MM-DD"
}

// For Editing Contacts
export type AddMode = { mode: 'add'; type: ContactType }
export type EditMode = { mode: 'edit'; id: string }
export type FormMode = AddMode | EditMode



export type UserRole = 'student' | 'mentor'  | 'admin'

export interface User {
    /** UUIDv4 */
    id: string

    firstName: string

    lastName: string

    email: string

    signature?: string  // Base64 jpeg

    roles: UserRole[]
}
