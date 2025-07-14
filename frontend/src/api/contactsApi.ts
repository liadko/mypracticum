import type { Contact, NewContact } from '../types'


export async function fetchAllContacts(
): Promise<Contact[]> {
    const res = await fetch(`/contacts`)

    if (!res.ok) throw new Error(res.statusText)
    return res.json()
}

export async function createContact(newC: NewContact): Promise<Contact> {
    const res = await fetch(`/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newC)
    })
    if (!res.ok) throw new Error(res.statusText)
    return res.json()
}

export async function updateContact(
    id: string,
    payload: NewContact
): Promise<Contact> {
    const res = await fetch(`/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<Contact>
}

// this route is not really implemented
export async function deleteContact(id: string): Promise<void> {
    const res = await fetch(`/contacts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(res.statusText)
}
