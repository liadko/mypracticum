import type { Contact, NewContact } from '../types'
import { apiFetch } from './client'
import { HttpError } from './errors'


export async function fetchAllContacts(
): Promise<Contact[]> {
    const res = await apiFetch(`/api/v1/contacts`)

    if (!res.ok) throw new Error(res.statusText)
    return res.json()
}

export async function createContact(newC: NewContact): Promise<Contact> {
    const res = await apiFetch(`/api/v1/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newC)
    })
    if (!res.ok) {
        let errorData = null;
        try {
            // Try to get the JSON error message from the response body
            errorData = await res.json();
        } catch (e) {
            // Ignore if there's no JSON body
        }

        // Throw our custom error with the status code
        throw new HttpError(
            errorData?.error || res.statusText, // Use server message or fallback
            res.status,
            errorData,
        );
    }
    return res.json()
}

export async function updateContact(
    id: string,
    payload: NewContact
): Promise<Contact> {
    const res = await apiFetch(`/api/v1/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<Contact>
}

export async function inviteMentorContact(
    id: string,
): Promise<Contact> {
    const res = await apiFetch(`/api/v1/contacts/${id}/invite`, {
        method: 'POST',
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<Contact>
}

