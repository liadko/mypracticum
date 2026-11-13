import { useState } from 'react'
import { useContacts } from '../../context/ContactsContext'
import { useAuth } from '../../context/AuthContext'
import { needsCenterDetails } from '../../domain/contacts'
import { EditContactsModal } from './EditContactsModal'
import './NewFieldsNotice.css'

/**
 * A small card in the corner of the student page while any training-centre
 * client still has none of the new centre fields. Closing it hides it until
 * the next visit; it stops appearing once every such client has at least one.
 */
export function NewFieldsNotice() {
    const { contacts, setActivePage } = useContacts()
    const { user } = useAuth()
    const [dismissed, setDismissed] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const missing = contacts.filter(needsCenterDetails)

    if (editingId) {
        return (
            <EditContactsModal
                initialType="client"
                isInitialCreation={false}
                initialEditId={editingId}
                onCloseModal={() => setEditingId(null)}
            />
        )
    }

    if (dismissed || missing.length === 0 || user?.status === 'frozen') return null

    return (
        <div className="new-fields-notice" dir="rtl" role="status">
            <button
                type="button"
                className="new-fields-notice__close"
                aria-label="סגירה"
                onClick={() => setDismissed(true)}
            >×</button>
            <div className="new-fields-notice__title">הוספנו שדות חדשים</div>
            <p className="new-fields-notice__text">
                {missing.length === 1
                    ? 'חסרים פרטי מרכז ההכשרה למטופל/ת אחד/ת.'
                    : `חסרים פרטי מרכז ההכשרה ל־${missing.length} מטופלים.`}
            </p>
            <button
                type="button"
                className="new-fields-notice__action"
                onClick={() => {
                    setActivePage('client')
                    setEditingId(missing[0].id)
                }}
            >
                להשלמת הפרטים
            </button>
        </div>
    )
}
