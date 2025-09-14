import { useEffect, useState } from 'react'
import type { ContactType } from '../types'

type ContactOrStudent = ContactType | 'student'
type Selected = Record<ContactOrStudent, string>

const STORAGE_KEY = 'selected.v1'
const DEFAULT: Selected = { student: '', therapist: '', client: '', mentor: '' }

export function useSelected() {
    const [sel, setSel] = useState<Selected>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
            console.log("loaded saved: ")
            console.log(saved)
            return { ...DEFAULT, ...saved }
        } catch {
            console.log("failed to load selected")
            return DEFAULT
        }
    })
    
    console.log(sel)

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sel)) } catch { }
    }, [sel])

    function getSelected(kind: ContactOrStudent) {
        return sel[kind]
    }

    function setSelected(kind: ContactOrStudent, id: string) {
        setSel(s => ({ ...s, [kind]: id }))
    }



    return { getSelected, setSelected }
}