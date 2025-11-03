// EditContactsModal.tsx
import { useState } from 'react'
import { useContacts } from '../../context/ContactsContext'
import type { ContactType, FormMode } from '../../types'
import { ContactRow } from './ContactRow'
import { ContactForm } from './ContactForm'
import './EditContactsModal.css'
import { contactLabelSingularBigenderIndefinite, contactLabelSingularDefinite } from '../../i18n/he'

interface Props {
    initialType: ContactType
    isInitialCreation: boolean
    onCloseModal: () => void
}


export function EditContactsModal({ initialType, isInitialCreation, onCloseModal }: Props) {
    const [currentPage, setPage] = useState<ContactType>(initialType)
    const [formMode, setFormMode] = useState<FormMode | null>(isInitialCreation ? { mode: 'add', type: initialType } : null)


    const {
        getContactsByType,
        setSelected,
        setActivePage,
    } = useContacts()




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
                <nav className={`edit-modal__nav ${currentPage}-page-theme`}>
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

                <div className={`edit-modal__content ${currentPage}-page-theme`}>
                    {contacts.map(c => (
                        <ContactRow
                            key={c.id}
                            contact={c}
                            onEdit={openEdit}
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
            return "עריכת " + contactLabelSingularBigenderIndefinite[currentPage];

        return "אנשי קשר | פרקטיקום";
    }

    function onCloseForm(closeEntireModal?: boolean) {
        if (closeEntireModal)
            onCloseModal()

        setFormMode(null)
    }

    function onCloseAndSelectContact(type: ContactType, id: string): void {
        setSelected(type, id)
        setActivePage(type)
        onCloseModal()
    }

    return (
        <div
            className="edit-modal-overlay"
            onClick={() => { if (!formMode) onCloseModal() }}
        >
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="edit-modal__header">
                    <h2>{headerText()}</h2>
                    {
                        // don't show X when form is active 
                        !formMode && <button
                            className="edit-modal__close"
                            onClick={onCloseModal}
                            aria-label="Close"
                        >×</button>
                    }
                </header>

                {/* Content */}
                {formMode ?
                    <ContactForm formMode={formMode} onCloseForm={onCloseForm} onCloseAndSelectContact={onCloseAndSelectContact} isInitialCreation={isInitialCreation} />
                    :
                    renderMainView()
                }

            </div>
        </div>
    )
}

