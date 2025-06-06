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

interface BasePageState {
    totalHours: number;
    title: string;
}
export interface PersonalPageState extends BasePageState {
    entries: PersonalEntry[];
}

export interface MentorPageState extends BasePageState {
    entries: MentorEntry[];
}

export interface ClientsPageState extends BasePageState {
    entries: ClientEntry[];
}



export interface Mentor {
    name: string;
    email: string;

    specialty: "clinical" | "dynamic" | "skateboarder";
}

export interface ExternalTherapist {
    name: string;
}