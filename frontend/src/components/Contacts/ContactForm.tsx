import React, { useState, useEffect, useRef } from 'react'
import { useContacts } from '../../context/ContactsContext'
import type { ContactType, FormMode, NewContact } from '../../types'
import './ContactForm.css'
import { needsCenterDetails, validateContact } from '../../domain/contacts'
import { showError } from '../../utils/toast'
import { MentorConfirmModal } from './MentorConfirmModal'
import { useAuth } from '../../context/AuthContext'


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
    centerName: string
    centerCity: string
    centerContactPerson: string
    centerContactPhone: string
}

export function ContactForm({ formMode, isInitialCreation, onCloseForm, onCloseAndSelectContact }: ContactFormProps) {
    const { getContactById, addContact, updateContact } = useContacts()
    const { user } = useAuth()

    // formValues holds every field at once
    const [formValues, setFormValues] = useState<FormValues>()

    const nameRef = useRef<HTMLInputElement>(null)

    const [alreadyFocusedNameFlag, setFocusedNameFlag] = useState(false);

    const [showMentorConfirm, setShowMentorConfirm] = useState(false);

    // Set when editing an older training-centre client that has none of the new
    // fields: holds what the student originally typed, shown in a dismissible notice.
    const [olderCenterText, setOlderCenterText] = useState<string | null>(null)

    // The form scrolls inside the modal; this says whether fields are hidden below.
    const formRef = useRef<HTMLFormElement>(null)
    const [hasMoreBelow, setHasMoreBelow] = useState(false)
    const updateHasMoreBelow = () => {
        const el = formRef.current
        if (el) setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 24)
    }
    useEffect(updateHasMoreBelow, [formValues?.clientInstitution, olderCenterText])
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
            if (needsCenterDetails(existing) && existing.type === 'client') {
                setOlderCenterText(existing.clientTrainingCenterInfo ?? '')
            }
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
                centerName: isClient ? existing.trainingCenter?.name ?? '' : '',
                centerCity: isClient ? existing.trainingCenter?.city ?? '' : '',
                centerContactPerson: isClient ? existing.trainingCenter?.contactPerson ?? '' : '',
                centerContactPhone: isClient ? existing.trainingCenter?.contactPhone ?? '' : '',

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
                centerName: '',
                centerCity: '',
                centerContactPerson: '',
                centerContactPhone: '',

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

    const {
        type, name, email, phone, specialty, clientInstitution, clientTrainingCenterInfo,
        centerName, centerCity, centerContactPerson, centerContactPhone,
    } = formValues

    const isNudged = olderCenterText !== null
    // New contacts must name the centre; older ones already have a description.
    const centerRequired = !clientTrainingCenterInfo
    const centerStar = centerRequired && <span className="contact-form__required" aria-hidden="true">*</span>
    const trainingCenter = {
        name: centerName.trim(),
        city: centerCity.trim(),
        contactPerson: centerContactPerson.trim(),
        ...(centerContactPhone.trim() && { contactPhone: centerContactPhone.trim() }),
    }
    const hasCenterDetails = !!(trainingCenter.name || trainingCenter.city || trainingCenter.contactPerson || trainingCenter.contactPhone)
    const isCenterComplete = !!(trainingCenter.name && trainingCenter.city && trainingCenter.contactPerson)



    function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setFormValues(fv => ({ ...fv!, [field]: value }))
    }

    async function handleAddNewContact(newContact: NewContact) {
        const created = await addContact(newContact)
        onCloseAndSelectContact(type, created.id)

    }
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (user?.status === 'frozen') {
            showError('החשבון אינו פעיל, ולכן לא ניתן לבצע שינויים.')
            return
        }

        const isCenter = clientInstitution === 'trainingCenter'
        const newContact: NewContact = {
            type,
            name,
            ...(type === 'client' && {
                clientInstitution,
                // An older contact keeps its original text. A new one gets a
                // summary, so it also saves against an older backend.
                clientTrainingCenterInfo: isCenter && !clientTrainingCenterInfo && isCenterComplete
                    ? `${trainingCenter.name}, ${trainingCenter.city}`
                    : clientTrainingCenterInfo,
                ...(isCenter && (hasCenterDetails || !clientTrainingCenterInfo) && { trainingCenter }),
            }),
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
            <form className="contact-form" onSubmit={handleSubmit} noValidate ref={formRef} onScroll={updateHasMoreBelow}>

                <div className="contact-form__field">
                    <label className="contact-form__label">
                        {type === 'client' ? 'שם המטופל בראשי תיבות' : 'שם מלא'}<span className="contact-form__required" aria-hidden="true">*</span>
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
                            אימייל<span className="contact-form__required" aria-hidden="true">*</span>
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
                                טלפון<span className="contact-form__required" aria-hidden="true">*</span>
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
                                הכשרה<span className="contact-form__required" aria-hidden="true">*</span>
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
                                מסגרת טיפול<span className="contact-form__required" aria-hidden="true">*</span>
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
                        {clientInstitution == 'trainingCenter' && (
                            <>
                                {isNudged && (
                                    <div className="contact-form__notice" dir="rtl" role="status">
                                        <button
                                            type="button"
                                            className="contact-form__notice-close"
                                            aria-label="סגירה"
                                            onClick={() => setOlderCenterText(null)}
                                        >×</button>
                                        <div className="contact-form__notice-title">הוספנו שדות חדשים למרכז ההכשרה</div>
                                        {olderCenterText && (
                                            <div className="contact-form__notice-text">
                                                מה שכתבת בעבר: <strong>{olderCenterText}</strong>
                                            </div>
                                        )}
                                        <div className="contact-form__notice-text">
                                            אפשר להשלים למטה את שם המרכז, העיר ואיש הקשר.
                                        </div>
                                    </div>
                                )}
                                <div className="contact-form__field">
                                    <label className="contact-form__label">
                                        <span>שם המרכז{centerStar}{isNudged && <span className="contact-form__new-pill">חדש</span>}</span>
                                        <input
                                            type="text"
                                            className="contact-form__input"
                                            placeholder='עמותת הלל'
                                            value={centerName}
                                            onChange={e => handleChange('centerName', e.target.value)}
                                            dir='rtl'
                                        />
                                    </label>
                                </div>
                                <div className="contact-form__field">
                                    <label className="contact-form__label">
                                        <span>עיר{centerStar}{isNudged && <span className="contact-form__new-pill">חדש</span>}</span>
                                        <input
                                            type="text"
                                            className="contact-form__input"
                                            placeholder='אשדוד'
                                            value={centerCity}
                                            onChange={e => handleChange('centerCity', e.target.value)}
                                            dir='rtl'
                                        />
                                    </label>
                                </div>
                                <div className="contact-form__field">
                                    <label className="contact-form__label">
                                        <span>איש קשר במרכז{centerStar}{isNudged && <span className="contact-form__new-pill">חדש</span>}</span>
                                        <input
                                            type="text"
                                            className="contact-form__input"
                                            value={centerContactPerson}
                                            onChange={e => handleChange('centerContactPerson', e.target.value)}
                                            dir='rtl'
                                        />
                                    </label>
                                </div>
                                <div className="contact-form__field">
                                    <label className="contact-form__label">
                                        <span>טלפון ליצירת קשר{isNudged && <span className="contact-form__new-pill">חדש</span>}</span>
                                        <input
                                            type="tel"
                                            className="contact-form__input"
                                            value={centerContactPhone}
                                            onChange={e => handleChange('centerContactPhone', e.target.value)}
                                            dir='rtl'
                                        />
                                    </label>
                                </div>
                            </>
                        )}
                    </>

                )}

                <div className="contact-form__buttons">
                    {hasMoreBelow && (
                        <button
                            type="button"
                            className="contact-form__more-hint"
                            onClick={() => formRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
                        >
                            {isNudged ? 'יש למטה שדות חדשים' : 'יש עוד שדות למטה'} ↓
                        </button>
                    )}
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
