import { useState, useRef, useEffect } from 'react'
import type { Contact, ContactType } from '../../types'
import { contactLabelPluralShort } from '../../i18n/he'
import './ContactDropdown.css'

interface Props {
  contacts: Contact[]
  value: string
  onChange: (id: string) => void

  contactType: ContactType | "student" // name displayed in "Edit Mentors/Therapists/Clients"
}

export function ContactDropdown({ contacts, value, onChange, contactType }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

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
      </div>

      <div className="contact-dropdown-menu">
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
          </div>
        ))}
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