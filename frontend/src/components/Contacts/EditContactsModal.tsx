// EditContactsModal.tsx
import { useRef, useEffect, useState } from 'react'
import { useContacts } from '../../context/ContactsContext'
import type { ContactType, FormMode } from '../../types'
import { ContactRow } from './ContactRow'
import { ContactForm } from './ContactForm'
import './EditContactsModal.css'
import { contactLabelSingular } from '../../i18n/he'

interface Props {
    initialType: ContactType
    onClose: () => void
}


export function EditContactsModal({ initialType, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [currentPage, setPage] = useState<ContactType>(initialType)
    const [formMode, setFormMode] = useState<FormMode | null>(null)


    const {
        getContactsByType,
    } = useContacts()

    // open the outer dialog
    useEffect(() => {
        const dlg = dialogRef.current
        if (dlg && !dlg.open) dlg.showModal()
        return () => {
            if (dlg && dlg.open) dlg.close()
        }
    }, [])

    function handleClose() {
        const dlg = dialogRef.current
        if (dlg && dlg.open) dlg.close()
        onClose()
    }

    function openAdd() {
        setFormMode({ mode: 'add', type: currentPage })
    }

    function openEdit(id: string) {
        setFormMode({ mode: 'edit', id })
    }


    const contacts = getContactsByType(currentPage)


    function renderMainView() {
        return (
            <>
                <nav className="edit-modal__nav">
                    <button
                        className={`edit-modal__nav-button ${currentPage === 'client' ? 'active' : ''}`}
                        onClick={() => setPage('client')}
                    >מטופלים פרטיים</button>
                    <button
                        className={`edit-modal__nav-button ${currentPage === 'mentor' ? 'active' : ''}`}
                        onClick={() => setPage('mentor')}
                    >מדריכים</button>
                    <button
                        className={`edit-modal__nav-button ${currentPage === 'therapist' ? 'active' : ''}`}
                        onClick={() => setPage('therapist')}
                    >מטפלים אישיים</button>
                </nav>

                <div className="edit-modal__content">
                    {contacts.map(c => (
                        <ContactRow
                            key={c.id}
                            contact={c}
                            onEdit={openEdit}
                            //onDelete={() => deleteContact(c.id)}
                        />
                    ))}
                </div>
                    <button className="edit-modal__add-button" onClick={openAdd}>
                        לחצו להוספה
                    </button>
            </>
        )
    }

    function headerText(): string {

        if (formMode)
            return "עריכת פרטי " + contactLabelSingular[currentPage];

        return "עריכת אנשי קשר";
    }

    return (
        <div
            className="edit-modal-overlay"
            onClick={() => { if (!formMode) onClose() }}
        >
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
                <header className="edit-modal__header">
                    <h2>{headerText()}</h2>
                    {
                        // don't show X when form is active 
                        !formMode && <button
                            className="edit-modal__close"
                            onClick={handleClose}
                            aria-label="Close"
                        >×</button>
                    }
                </header>

                {formMode ?
                    <ContactForm formMode={formMode} onClose={() => setFormMode(null)} />
                    :
                    renderMainView()
                }

            </div>
        </div>
    )
}

