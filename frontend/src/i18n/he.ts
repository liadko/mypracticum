import type { ContactType } from '../types'

export const contactLabelSingular: Record<ContactType, string> = {
  client:    'מטופל פרטי',
  mentor:    'מדריך',
  therapist: 'מטפל אישי',
}

export const contactLabelPluralShort: Record<ContactType, string> = {
  client:    'מטופלים',
  mentor:    'מדריכים',
  therapist: 'מטפלים',
}

export const contactLabelPluralLong: Record<ContactType, string> = {
  client:    'מטופלים פרטיים',
  mentor:    'מדריכים',
  therapist: 'מטפלים אישיים',
}

export const pageHeaderText: Record<ContactType, string> = {
  client:    'שעות הטיפול עם',
  mentor:    'שעות הדרכה עם',
  therapist: 'שעות טיפול אישי עם',
}

export const pageTitle: Record<ContactType, string> = {
  client:    'מטופלים פרטיים',
  mentor:    'הדרכה',
  therapist: 'טיפול אישי',
}
