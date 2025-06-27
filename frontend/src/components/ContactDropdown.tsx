import React, { useState, useRef, useEffect } from 'react'
import type { Contact } from '../types'
import './ContactDropdown.css'

interface Props {
  contacts: Contact[]
  value: string
  onChange: (id: string) => void
}

export function ContactDropdown({ contacts, value, onChange }: Props) {
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

  return (
    <div
      ref={root}
      className={`contact-dropdown${open ? ' open' : ''}`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="contact-dropdown-toggle">
        {selected?.name ?? 'בחר…'}
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

        <div
          className="contact-dropdown-footer"
          onClick={e => {
            e.stopPropagation()
            onChange('__edit__')
            setOpen(false)
          }}
        >
          עריכת מטופלים &#9881;
        </div>
      </div>
    </div>
  )
}