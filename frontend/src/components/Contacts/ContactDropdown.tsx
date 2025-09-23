import { useState, useRef, useEffect } from 'react'
import type { Contact, ContactType } from '../../types'
import { contactLabelPluralShort } from '../../i18n/he'
import './ContactDropdown.css'
import { useEntries } from '../../context/EntriesContext'

interface Props {
  contacts: Contact[]
  value: string
  onChange: (id: string) => void

  contactType: ContactType | "student" // name displayed in "Edit Mentors/Therapists/Clients"
}

export function ContactDropdown({ contacts, value, onChange, contactType }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const { unapprovedCounts } = useEntries();

  // close when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const selected = contacts.find(c => c.id === value)

  function isContactType(t: ContactType | "student"): t is ContactType {
    return t !== "student"
  }

  function isStudent(t: ContactType | "student" | undefined) {
    return t === "student"
  }

  function unapprovedCount(contact: Contact | undefined) {
    if (contact === undefined || !isStudent(contact.type)) return undefined

    return unapprovedCounts[contact.id]

  }

  function unapprovedFlagText(contact: Contact | undefined) {
    const count = unapprovedCount(contact)
    if (!count) return

    if (count === 1) return "1 לא אושר";
    return count + " לא אושרו";
  }

  return (
    <div
      ref={root}
      className={`contact-dropdown${open ? ' open' : ''}`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="contact-dropdown-toggle">
        <span className="contact-dropdown-label">
          {selected?.name ?? 'בחר…'}
        </span>
        {unapprovedCount(selected) &&
          <span className='unapproved-entries-flag'>
            {unapprovedFlagText(selected)}
          </span>}
      </div>

      <div className="contact-dropdown-menu">
        <div className="contact-dropdown-items">
          {contacts.map(c => (
            <div
              key={c.id}
              className={
                'contact-dropdown-item' +
                (c.id === value ? ' active' : '')
              }
              onClick={e => {
                e.stopPropagation()
                onChange(c.id)
                setOpen(false)
              }}
            >
              {c.name}
              {unapprovedCount(c) &&
                <span className='unapproved-entries-flag smaller'>
                  {unapprovedFlagText(c)}
                </span>}
            </div>

          ))}
        </div>
        {
          isContactType(contactType) &&
          <div
            className="contact-dropdown-footer"
            onClick={e => {
              e.stopPropagation()
              onChange('__edit__')
              setOpen(false)
            }}
          >
            &#9881; עריכת {contactLabelPluralShort[contactType]}
          </div>
        }
      </div>
    </div>
  )
}