import type { Contact } from '../../types'
import './ContactRow.css'

interface Props {
  contact: Contact
  onEdit: (id : string) => void
  //onDelete: (id: string) => void
}

export function ContactRow({ contact, onEdit }: Props) {
  return (
    <div className="contact-row">
      <div className="contact-row__details">
        <div className="contact-row__name">{contact.name}</div>

        {contact.type === 'mentor' && (
          <div className="contact-row__extras">
            <div className="contact-row__email">{contact.email}</div>
            <div className="contact-row__phone">{contact.phone}</div>
            <div className="contact-row__specialty">{contact.specialty}</div>
          </div>
        )}

        {contact.type === 'therapist' && (
          <div className="contact-row__extras">
            <div className="contact-row__phone">{contact.phone}</div>
            <div className="contact-row__specialty">{contact.specialty}</div>
          </div>
        )}
      </div>

      <div className="contact-row__actions">
        <img
          className="icon-button edit"
          src='edit.svg'
          onClick={() => onEdit(contact.id)}
          aria-label="Edit"
        />
        {/* <button
          className="icon-button delete"
          onClick={() => onDelete(contact.id)}
          aria-label="Delete"
        >🗑️</button> */}
      </div>
    </div>
  )
}
