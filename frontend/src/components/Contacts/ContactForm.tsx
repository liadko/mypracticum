import React, { useState, useEffect, useRef } from 'react'
import { useContacts } from '../../context/ContactsContext'
import type { ContactType, FormMode, NewContact } from '../../types'
import './ContactForm.css'
import { validateContact } from '../../domain/contacts'
import { showError } from '../../utils/toast'
import { MentorConfirmModal } from './MentorConfirmModal'


interface ContactFormProps {
    formMode: FormMode
    onCloseForm: (closeEntireModal: boolean) => void
    onCloseAndSelectContact: (type: ContactType, id: string) => void
    isInitialCreation: boolean
}

interface FormValues {
    type: ContactType
    name: string
    email: string
    phone: string
    specialty: string
    clientInstitution: string
    clientTrainingCenterInfo: string
}

export function ContactForm({ formMode, isInitialCreation, onCloseForm, onCloseAndSelectContact }: ContactFormProps) {
    const { getContactById, addContact, updateContact } = useContacts()

    // formValues holds every field at once
    const [formValues, setFormValues] = useState<FormValues>()

    const nameRef = useRef<HTMLInputElement>(null)

    const [alreadyFocusedNameFlag, setFocusedNameFlag] = useState(false);

    const [showMentorConfirm, setShowMentorConfirm] = useState(false);
    const [addedMentor, setAddedMentor] = useState<NewContact | null>(null);

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

    const { type, name, email, phone, specialty, clientInstitution, clientTrainingCenterInfo } = formValues



    function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setFormValues(fv => ({ ...fv!, [field]: value }))
    }

    async function handleAddNewContact(newContact: NewContact) {
        const created = await addContact(newContact)
        onCloseAndSelectContact(type, created.id)

    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const newContact: NewContact = {
            type,
            name,
            ...(type === 'client' && { clientInstitution, clientTrainingCenterInfo }),
            ...(type === 'mentor' && { email, phone, specialty }),
            ...(type === 'therapist' && { phone, specialty }),
        }

        const err = validateContact(newContact)
        if (err) {
            showError(err.message)
            return
        }


        if (formMode.mode === 'edit') {
            await updateContact(formMode.id, newContact)
            onCloseForm(false)
        } else if (type === 'mentor') {
            setAddedMentor(newContact)
            setShowMentorConfirm(true)
        }
        else {
            await handleAddNewContact(newContact)
        }
    }

    return (
        <>
            <div className='contact-form__fake-navbar' />
            <form className="contact-form" onSubmit={handleSubmit} noValidate>

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


                {type === 'client' && (
                    <>
                        <div className='contact-form__gap' />
                        <div className="contact-form__field">
                            <label className="contact-form__label">
                                מסגרת טיפול
                                <div className="contact-form__radio-group">
                                    <label className="contact-form__radio">
                                        <input
                                            type="radio"
                                            name="clientInstitution"
                                            value="individual"
                                            checked={clientInstitution == 'privateClinic'}
                                            onChange={() => handleChange('clientInstitution', 'privateClinic')}
                                        />
                                        קליניקה פרטית
                                    </label>
                                    <label className="contact-form__radio">
                                        <input
                                            type="radio"
                                            name="clientInstitution"
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
                        onClick={() => onCloseForm(isInitialCreation)} // close entire modal if was initial creation
                    >
                        ביטול
                    </button>
                    <button type="submit" className="contact-form__save-button">
                        שמירה
                    </button>
                </div>
            </form>

            {showMentorConfirm && addedMentor && (
                <MentorConfirmModal
                    mentor={addedMentor}
                    onClose={() => setShowMentorConfirm(false)}
                    onConfirm={() => handleAddNewContact(addedMentor)}
                />
            )}
        </>
    )
}
