import React, { useState, useEffect, useRef } from 'react'
import { useContacts } from '../../context/ContactsContext'
import type { ContactType, FormMode, NewContact } from '../../types'
import './ContactForm.css'
import { validateContact } from '../../domain/contacts'
import { showError } from '../../utils/toast'


interface ContactFormProps {
    formMode: FormMode
    onClose: () => void
}

interface FormValues {
    type: ContactType
    name: string
    email: string
    phone: string
    specialty: string
    mentorshipType: string
    clientInstitution: string
    clientTrainingCenterInfo: string
}

export function ContactForm({ formMode, onClose }: ContactFormProps) {
    const { getContactById, addContact, updateContact } = useContacts()

    // formValues holds every field at once
    const [formValues, setFormValues] = useState<FormValues>()

    const nameRef = useRef<HTMLInputElement>(null)

    const [alreadyFocusedNameFlag, setFocusedNameFlag] = useState(false);

    // initialize once on mount
    useEffect(() => {
        if (formMode.mode === 'edit') {
            const existing = getContactById(formMode.id)
            if (!existing || existing.type === 'student') {
                console.error("Error Initializing ContactForm")
                showError("Can't Edit Contact Right Now")
                return;
            }

            const isClient = existing.type === 'client'
            const isMentor = existing.type === 'mentor'
            const isTherapist = existing.type === 'therapist'

            setFormValues({
                type: existing.type,
                name: existing.name,

                email: isMentor ? existing.email : '',

                phone: isMentor || isTherapist ? existing.phone : '',
                specialty: isMentor || isTherapist ? existing.specialty : '',
                mentorshipType: isMentor ? existing.mentorshipType : '',

                clientInstitution: isClient ? existing.clientInstitution : '',
                clientTrainingCenterInfo: isClient ? existing.clientTrainingCenterInfo : '',

            })
        } else {
            // add mode
            setFormValues({
                type: formMode.type,
                name: '',
                email: '',
                phone: '',
                specialty: '',
                mentorshipType: '',
                clientInstitution: '',
                clientTrainingCenterInfo: '',

            })
        }

    }, [])

    useEffect(() => {
        if (formValues && !alreadyFocusedNameFlag) {
            nameRef.current?.focus()
            setFocusedNameFlag(true)
        }
    }, [formValues])

    // while loading initial, render nothing (or a loader)
    if (!formValues) return null

    const { type, name, email, phone, specialty, mentorshipType, clientInstitution, clientTrainingCenterInfo } = formValues



    function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setFormValues(fv => ({ ...fv!, [field]: value }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const newContact: NewContact = {
            type,
            name,
            ...(type === 'client' && {clientInstitution, clientTrainingCenterInfo}),
            ...(type === 'mentor' && { email, phone, specialty, mentorshipType }),
            ...(type === 'therapist' && { phone, specialty }),
        }

        const err = validateContact(newContact)
        if (err) {
            showError(err.message)
            return
        }


        if (formMode.mode === 'edit') {
            updateContact(formMode.id, newContact)
        } else {
            addContact(newContact)
        }
        onClose()
    }

    return (

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className='contact-form__fake-navbar' />

            <div className="contact-form__field">
                <label className="contact-form__label">
                    {type === 'client' ? 'שם המטופל בראשי תיבות' : 'שם מלא'}
                    < input
                        ref={nameRef}
                        type="text"
                        placeholder={type == 'client' ? 'א.ב' : ''}
                        className="contact-form__input"
                        value={name}
                        onChange={e => handleChange('name', e.target.value)}
                        required
                    />
                </label>
            </div>

            {type === 'mentor' && (
                <div className="contact-form__field">
                    <label className="contact-form__label">
                        אימייל
                        <input
                            type="email"
                            className="contact-form__input"
                            value={email}
                            onChange={e => handleChange('email', e.target.value)}
                            required
                        />
                    </label>
                </div>

            )}

            {type !== 'client' && (
                <>
                    <div className="contact-form__field">
                        <label className="contact-form__label">
                            טלפון
                            <input
                                type="tel"
                                className="contact-form__input"
                                value={phone}
                                onChange={e => handleChange('phone', e.target.value)}
                                required
                                dir='rtl'
                            />
                        </label>
                    </div>
                    <div className="contact-form__field">
                        <label className="contact-form__label">
                            הכשרה
                            <input
                                type="text"
                                className="contact-form__input"
                                value={specialty}
                                onChange={e => handleChange('specialty', e.target.value)}
                                required
                            />
                        </label>
                    </div>
                </>
            )}

            {type === 'mentor' && (
                <div className="contact-form__field">
                    <label className="contact-form__label">
                        סוג הדרכה
                        <div className="contact-form__radio-group">
                            <label className="contact-form__radio">
                                <input
                                    type="radio"
                                    name="mentorshipType"
                                    value="individual"
                                    checked={mentorshipType == 'individual'}
                                    onChange={() => handleChange('mentorshipType', 'individual')}
                                />
                                הדרכה אישית
                            </label>
                            <label className="contact-form__radio">
                                <input
                                    type="radio"
                                    name="mentorshipType"
                                    value="group"
                                    checked={mentorshipType == 'group'}
                                    onChange={() => handleChange('mentorshipType', 'group')}
                                />
                                הדרכה קבוצתית
                            </label>
                        </div>
                    </label>
                </div>

            )}


            {type === 'client' && (
                <>
                <div className='contact-form__gap'/>
                    <div className="contact-form__field">
                        <label className="contact-form__label">
                            מסגרת טיפול
                            <div className="contact-form__radio-group">
                                <label className="contact-form__radio">
                                    <input
                                        type="radio"
                                        name="mentorshipType"
                                        value="individual"
                                        checked={clientInstitution == 'privateClinic'}
                                        onChange={() => handleChange('clientInstitution', 'privateClinic')}
                                    />
                                    קליניקה פרטית
                                </label>
                                <label className="contact-form__radio">
                                    <input
                                        type="radio"
                                        name="mentorshipType"
                                        value="group"
                                        checked={clientInstitution == 'trainingCenter'}
                                        onChange={() => handleChange('clientInstitution', 'trainingCenter')}
                                    />
                                    מרכז הכשרה
                                </label>
                            </div>
                        </label>
                    </div>
                    {clientInstitution == 'trainingCenter' &&
                        <div className="contact-form__field">
                            <label className="contact-form__label">
                                שם ומיקום המרכז
                                <input
                                    type="tel"
                                    className="contact-form__input"
                                    placeholder='עמותת הלל, אשדוד'
                                    value={clientTrainingCenterInfo}
                                    onChange={e => handleChange('clientTrainingCenterInfo', e.target.value)}
                                    required
                                    dir='rtl'
                                />
                            </label>
                        </div>}
                </>

            )}

            <div className="contact-form__buttons">
                <button
                    type="button"
                    className="contact-form__cancel-button"
                    onClick={onClose} // BAD, should ask for confirmation
                >
                    ביטול
                </button>
                <button type="submit" className="contact-form__save-button">
                    שמירה
                </button>
            </div>
        </form>
    )
}
