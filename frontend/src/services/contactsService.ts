import type { Contact, NewContact } from '../types'

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchAllContacts(studentId: string
): Promise<Contact[]> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/contacts`)

    if (!res.ok) throw new Error(res.statusText)
    return res.json()
}

export async function createContact(studentId: string, newC: NewContact): Promise<Contact> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newC)
    })
    if (!res.ok) throw new Error(res.statusText)
    return res.json()
}

export async function updateContact(
    studentId: string,
    id: string,
    payload: NewContact
): Promise<Contact> {
    const res = await fetch(`${BASE_API_URL}/${studentId}/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<Contact>
}
export async function deleteContact(id: string): Promise<void> {
    const res = await fetch(`${BASE_API_URL}/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(res.statusText)
}
