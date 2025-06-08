import type {
    PersonalEntry,
    MentorEntry,
    ClientEntry,
    Category,
    BaseEntry,
} from "../types";


const BASE_API = "/api/students"

async function fetchPersonalEntries(studentId: string): Promise<PersonalEntry[]> {

    const url = `${BASE_API}/${studentId}/entries?category=personal`;
    const resp = await fetch(url);

    if (!resp.ok) {
        throw new Error(`Failed to load personal entries`);
    }


    // TS type checking
    return (await resp.json()) as PersonalEntry[];


}

async function fetchMentorEntries(
    studentId: string
): Promise<MentorEntry[]> {
    const url = `${BASE_API}/${studentId}/entries?category=mentor`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Failed to load mentor entries (status ${resp.status})`);
    }
    return (await resp.json()) as MentorEntry[];
}

async function fetchClientEntries(
    studentId: string
): Promise<ClientEntry[]> {
    const url = `${BASE_API}/${studentId}/entries?category=clients`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(
            `Failed to load client entries (status ${resp.status})`
        );
    }
    return (await resp.json()) as ClientEntry[];
}

async function addEntry(
    studentId: string,
    category: Category,
    date: string
): Promise<BaseEntry> {
    const resp = await fetch(
        `/api/students/${studentId}/entries/${category}`,
        { method: "POST", body: JSON.stringify({ date }) }
    )
    if (!resp.ok) {
        // you can read resp.status, resp.statusText, or even await resp.text()
        throw new Error(`Add failed: ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
}

async function deleteEntry(
    studentId: string,
    category: Category,
    entryId: string
): Promise<void> {
    const resp = await fetch(
        `/api/students/${studentId}/entries/${category}/${entryId}`,
        { method: "DELETE" }
    )
    if (!resp.ok) {
        throw new Error(`Delete failed: ${resp.status} ${resp.statusText}`)
    }
}

