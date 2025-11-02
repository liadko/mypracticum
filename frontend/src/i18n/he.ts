import type { ContactType } from '../types'



export const contactLabelSingularDefinite: Record<ContactType, string> = {
  client: 'המטופל הפרטי',
  mentor: 'המדריך',
  therapist: 'המטפל האישי שלי',
}


export const contactLabelSingularIndefinite: Record<ContactType, string> = {
  client: 'מטופל פרטי',
  mentor: 'מדריך',
  therapist: 'מטפל אישי',
}

export const contactLabelSingularBigenderIndefinite: Record<ContactType, string> = {
  client: 'מטופל/ת פרטי/ת',
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
  client: 'מטופלים פרטיים',
  mentor: 'מדריכים',
  therapist: 'מטפלים אישיים',
}

export const pageHeaderText: Record<ContactType, string> = {
  client: 'שעות הטיפול עם',
  mentor: 'שעות הדרכה עם',
  therapist: 'שעות טיפול אישי עם',
}

export const pageTitle: Record<ContactType, string> = {
  client: 'מטופלים פרטיים',
  mentor: 'הדרכה',
  therapist: 'טיפול אישי',
}
