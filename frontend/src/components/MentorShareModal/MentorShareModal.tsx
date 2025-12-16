import { useContacts } from '../../context/ContactsContext'
import './MentorShareModal.css'

interface MentorShareModalProps {
    mentorId: string
    mentorName: string
    mentorEmail: string
    onClose: () => void
}

export default function MentorShareModal({
    mentorId,
    mentorName,
    mentorEmail,
    onClose
}: MentorShareModalProps) {

    const { inviteContact } = useContacts()

    const handleSend = async () => {
        await inviteContact(mentorId)
        onClose()
    }

    return (
        <div className="mentor-share-modal__overlay">
            <div className="mentor-share-modal__content" dir="rtl">
                <button
                    className="mentor-share-modal__close-btn"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="mentor-share-modal__header">
                    שליחת מייל למדריך/ה
                </h2>

                <p className="mentor-share-modal__text">
                    לחיצה על הכפתור תשלח מייל למדריך/ה עם לינק לכניסה למערכת פרקטיקום.
                </p>

                <p className="mentor-share-modal__text">
                    מומלץ לשלוח את המייל אחת לחודשיים.
                </p>

                <p className="mentor-share-modal__text">
                    במידה והמדריך כבר נכנס בעבר למערכת,
                    אפשר פשוט להודיע לו בעל פה או בוואטסאפ שממתינות לו פגישות לאישור.
                </p>


                <div className="mentor-share-modal__actions">
                    <button
                        className="mentor-share-modal__btn mentor-share-modal__btn--primary"
                        onClick={handleSend}
                    >
                        שלחו מייל ל{mentorName}
                    </button>
                    <p className="mentor-share-modal__footer">
                        המייל ישלח אל {mentorEmail}
                    </p>
                </div>


            </div>
        </div>
    )
}