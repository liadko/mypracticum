import type { ContactType, UserClass } from '../types'
import { format, parseISO } from 'date-fns'

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

export function formatIsraeliDate(isoDate: string): string {
    return format(parseISO(isoDate), 'd.M.yyyy')
}
