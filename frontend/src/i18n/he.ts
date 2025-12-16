import type { ContactType } from '../types'



export const contactLabelSingularBigenderIndefinite: Record<ContactType, string> = {
  client: 'מטופל/ת שלי',
  mentor: 'מדריך/ה',
  therapist: 'מטפל/ת אישי/ת',
}

export const contactLabelSingularGenderless: Record<ContactType, string> = {
  client: 'מטופל/ת',
  mentor: 'מדריך/ה',
  therapist: 'מטפל/ת אישי/ת',
}

export const contactLabelPluralShort: Record<ContactType, string> = {
  client: 'מטופלים',
  mentor: 'מדריכים',
  therapist: 'מטפלים',
}

export const contactLabelPluralLong: Record<ContactType, string> = {
  client: 'מטופלים שלי',
  mentor: 'מדריכים',
  therapist: 'מטפלים אישיים',
}

export const pageHeaderText: Record<ContactType, string> = {
  client: 'שעות הטיפול עם',
  mentor: 'שעות הדרכה עם',
  therapist: 'שעות טיפול אישי עם',
}

export const pageTitle: Record<ContactType, string> = {
  client: 'מטופלים שלי',
  mentor: 'הדרכה',
  therapist: 'טיפול אישי',
}

export const pageTitleDefinite: Record<ContactType, string> = {
  client: 'המטופלים שלך',
  mentor: 'ההדרכה',
  therapist: 'הטיפול האישי',
}
