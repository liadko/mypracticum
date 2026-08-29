import type { ContactType, UserClass } from '../types'

export function reportingStartDateFor(classInfo: UserClass | null | undefined, contactType: ContactType): string | null {
    if (!classInfo) return null

    switch (contactType) {
        case 'client':
            return classInfo.clientStartDate
        case 'mentor':
            return classInfo.mentorStartDate
        case 'therapist':
            return classInfo.therapistStartDate
    }
}

export function isEntryDateAllowed(date: string, reportingStartDate?: string | null): boolean {
    const today = new Date().toISOString().slice(0, 10)
    return date <= today && (!reportingStartDate || date >= reportingStartDate)
}
