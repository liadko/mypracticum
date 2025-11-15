import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileModal.css'
import { useAuth } from '../../context/AuthContext'
import { showError } from '../../utils/toast'

type Props = {
    onClose: () => void
}

export default function ProfileModal({
    onClose,
}: Props) {

    const { logout, user, saveProfile } = useAuth()

    if (!user) return <div>שגיאה בטעינת המשתמש</div>

    const [firstName, setFirstName] = useState(user.firstName || '')
    const [lastName, setLastName] = useState(user.lastName || '')
    const [saving, setSaving] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const firstRef = useRef<HTMLInputElement>(null)
    // useEffect(() => { firstRef.current?.focus() }, [])

    const navigate = useNavigate();


    async function handleSave() {
        if (!firstName.trim()) {
            showError('אנא הזינו שם פרטי')
            return
        }
        if (!lastName.trim()) {
            showError('אנא הזינו שם משפחה')
            return
        }

        setSaving(true)
        try {
            await saveProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
        }
        finally { setSaving(false) }
    }

    return (
        <div className="profile-modal__overlay" onClick={onClose}>
            <div className="profile-modal__content" onClick={e => e.stopPropagation()} dir="rtl">
                <h2 className="profile-modal__title">הפרטים שלך</h2>

                <div className="profile-modal__field">
                    <label className="profile-modal__label">שם פרטי</label>
                    <input
                        ref={firstRef}
                        className="profile-modal__input"
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                    />
                </div>

                <div className="profile-modal__field">
                    <label className="profile-modal__label">שם משפחה</label>
                    <input
                        className="profile-modal__input"
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                    />
                </div>

                <div className="profile-modal__field">
                    <label className="profile-modal__label">אימייל</label>
                    <label className="profile-modal__text">{user?.email}</label>
                </div>

                <div className="profile-modal__actions">
                    <button className="profile-modal__btn profile-modal__btn--ghost" onClick={onClose}>
                        ביטול
                    </button>
                    <button
                        className="profile-modal__btn profile-modal__btn--primary"
                        onClick={handleSave}
                    >
                        {saving ? 'שומר…' : 'שמירה'}
                    </button>
                </div>

                <div className='profile-modal__hyperlink-container'>

                    <button className="profile-modal__hyperlink" onClick={() => setShowConfirm(true)}>
                        יציאה מהחשבון
                    </button>

                    {user.roles.includes('admin') &&
                        <button className="profile-modal__hyperlink" onClick={() => navigate('/admin', { replace: true })}>
                            כניסה לעמוד הניהול
                        </button>
                    }
                </div>

                {showConfirm && (
                    <div className="profile-modal__confirm-overlay" onClick={() => setShowConfirm(false)}>
                        <div className="profile-modal__confirm" onClick={e => e.stopPropagation()} dir="rtl">
                            <p className="profile-modal__confirm-text">רוצים לצאת מהחשבון?</p>
                            <div className="profile-modal__confirm-actions">
                                <button className="profile-modal__btn profile-modal__btn--ghost"
                                    onClick={() => setShowConfirm(false)}>
                                    ביטול
                                </button>
                                <button className="profile-modal__btn profile-modal__btn--primary"
                                    onClick={logout}>
                                    יציאה
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
