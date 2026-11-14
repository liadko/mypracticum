import type { Contact } from '../../types'
import './ContactRow.css'
import { needsCenterDetails } from '../../domain/contacts'

interface Props {
  contact: Contact
  onEdit: (id: string) => void
  //onDelete: (id: string) => void
}

export function ContactRow({ contact, onEdit }: Props) {
  const isTrainingCenter = contact.type == 'client' && contact.clientInstitution === 'trainingCenter';
  const trainingCenter = contact.type === 'client' ? contact.trainingCenter : undefined;
  const needsNewDetails = needsCenterDetails(contact);

  return (
    <div className={`contact-row${needsNewDetails ? ' contact-row--needs-details' : ''}`} onClick={() => onEdit(contact.id)}>
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

        {contact.type === 'client' && (
          <div className="contact-row__extras">
            <div className="contact-row__institution">{isTrainingCenter ? "מרכז הכשרה" : "קליניקה פרטית"}</div>
            {isTrainingCenter && (trainingCenter || contact.clientTrainingCenterInfo) && (
              <div className="contact-row__training-center">
                {trainingCenter ? [trainingCenter.name, trainingCenter.city].map(value => value?.trim()).filter(Boolean).join(', ') : contact.clientTrainingCenterInfo}
              </div>
            )}          </div>
        )}
      </div>

      <div className="contact-row__actions">
        {needsNewDetails && <span className="contact-row__new-badge">שדות חדשים</span>}
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
