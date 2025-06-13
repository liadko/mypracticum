export interface BaseEntry {
    id: string;          // unique ID for removal
    date: string;        // ISO format: "YYYY-MM-DD"
}

export interface PersonalEntry extends BaseEntry {
    externalTherapist: ExternalTherapist | null;
}
export interface MentorEntry extends BaseEntry {
    mentor: Mentor | null;
}
export interface ClientEntry extends BaseEntry {
    clientName: string;
}

export type SomeEntry =  PersonalEntry | MentorEntry | ClientEntry

export type Category = "personal" | "mentor" | "client"

export interface EntryMap {
    personal: PersonalEntry[]
    mentor: MentorEntry[]
    client: ClientEntry[]
}

export interface Mentor {
    name: string;
    email: string;

    specialty: "clinical" | "dynamic" | "skateboarder";
}

export interface ExternalTherapist {
    name: string;
}