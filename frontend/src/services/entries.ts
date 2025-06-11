import type {
    PersonalEntry,
    MentorEntry,
    ClientEntry,
    Category,
    BaseEntry,
} from "../types";


const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchPersonalEntries(studentId: string): Promise<PersonalEntry[]> {

    const url = `${BASE_API_URL}/${studentId}/entries/personal`;
    const resp = await fetch(url);

    if (!resp.ok) {
        throw new Error(`Failed to load personal entries`);
    }


    // TS type checking
    return (await resp.json()) as PersonalEntry[];


}

export async function fetchMentorEntries(
    studentId: string
): Promise<MentorEntry[]> {
    const url = `${BASE_API_URL}/${studentId}/entries/mentor`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Failed to load mentor entries (status ${resp.status})`);
    }
    return (await resp.json()) as MentorEntry[];
}

export async function fetchClientEntries(
    studentId: string
): Promise<ClientEntry[]> {
    const url = `${BASE_API_URL}/${studentId}/entries/client`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(
            `Failed to load client entries (status ${resp.status})`
        );
    }
    return (await resp.json()) as ClientEntry[];
}

export async function addEntry(
    studentId: string,
    category: Category,
    date: string
): Promise<BaseEntry> {
    const resp = await fetch(
        `${BASE_API_URL}/${studentId}/entries/${category}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date })
        }
    )
    if (!resp.ok) {
        // you can read resp.status, resp.statusText, or even await resp.text()
        throw new Error(`Add failed: ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
}

export async function deleteEntry(
    studentId: string,
    category: Category,
    entryId: string
): Promise<void> {
    const resp = await fetch(
        `${BASE_API_URL}/${studentId}/entries/${category}/${entryId}`,
        { method: "DELETE" }
    )
    if (!resp.ok) {
        throw new Error(`Delete failed: ${resp.status} ${resp.statusText}`)
    }
}


export async function updateClientName(studentId: string, entryId: string, newName: string): Promise<ClientEntry> {
    const response = await fetch(`${BASE_API_URL}/students/${studentId}/entries/client/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: newName }),
    });
    if (!response.ok) {
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
}